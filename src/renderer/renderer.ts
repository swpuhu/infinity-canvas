import type {
    Canvas,
    GrDirectContext,
    Paint,
    Surface,
    WebGLContextHandle,
} from 'canvaskit-wasm';

import SNode from './SNode';
import { CanvasKitModule } from '@/lib/canvaskit';
import { angleToRadians, loadImage } from '@/common/util';
import EventEmitter from 'eventemitter3';
import { EventNames } from '@/common/types';
import eventBus from '@/common/eventBus';
import { Vec2 } from '@/common/Vec2';
import { getRectByNode } from './util';

export class Renderer extends EventEmitter {
    private surface: Surface | null = null;

    private grContext: GrDirectContext | null = null;

    private _canvasElement: HTMLCanvasElement;
    private resizeObserver: ResizeObserver;

    private _currentRenderNode: SNode | null = null;
    private _glContextHandle: WebGLContextHandle;

    private needRedraw = false;

    private _preSelectedPaint: Paint | null = null;

    private _prevGlobalScaleX = 1;

    constructor(canvas: HTMLCanvasElement) {
        super();
        this._canvasElement = canvas;
        this._glContextHandle =
            CanvasKitModule.CanvasKit.GetWebGLContext(canvas);

        this.grContext = CanvasKitModule.CanvasKit.MakeWebGLContext(
            this._glContextHandle
        );
        if (!this.grContext) {
            throw new Error('Failed to create grContext');
        }

        this.surface = CanvasKitModule.CanvasKit.MakeOnScreenGLSurface(
            this.grContext,
            canvas.width,
            canvas.height,
            CanvasKitModule.CanvasKit.ColorSpace.SRGB
        );

        this.resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                this.resizeSurface(width, height);
                this.emit(EventNames.RESIZE, width, height);
            }
        });
        this.resizeObserver.observe(canvas);
        this.startCheckRedraw();

        this._preSelectedPaint = new CanvasKitModule.CanvasKit.Paint();
        this._preSelectedPaint.setStyle(
            CanvasKitModule.CanvasKit.PaintStyle.Stroke
        );
        this._preSelectedPaint.setStrokeWidth(2);
        this._preSelectedPaint.setColor([0.95, 0.5, 0, 0.5]);

        eventBus.onReDraw(this.reDraw);
    }

    getRenderTarget(width?: number, height?: number): Surface | null {
        if (!this.grContext) {
            return null;
        }
        return CanvasKitModule.CanvasKit.MakeRenderTarget(
            this.grContext,
            width ? width : this._canvasElement.width,
            height ? height : this._canvasElement.height
        );
    }

    private reDraw = () => {
        this.needRedraw = true;
    };

    private startCheckRedraw = () => {
        if (this.needRedraw) {
            this.render();
            this.needRedraw = false;
        }
        requestAnimationFrame(this.startCheckRedraw);
    };

    public resizeSurface(width: number, height: number) {
        this._canvasElement.width = width;
        this._canvasElement.height = height;
        if (this.surface) {
            this.surface.delete();
        }
        if (!this.grContext) {
            return;
        }
        this.surface = CanvasKitModule.CanvasKit.MakeOnScreenGLSurface(
            this.grContext,
            width,
            height,
            CanvasKitModule.CanvasKit.ColorSpace.SRGB
        );

        if (!this.surface) {
            console.error('创建Surface失败');
            return;
        }

        this.render();
    }

    private visitNode(
        node: SNode,
        renderFunc: (node: SNode) => void,
        beforeVisit?: (node: SNode) => void,
        afterVisit?: (node: SNode) => void
    ) {
        beforeVisit && beforeVisit(node);
        renderFunc(node);
        for (const child of node.children) {
            this.visitNode(child, renderFunc, beforeVisit, afterVisit);
        }
        afterVisit && afterVisit(node);
    }

    public getCanvas(): Canvas {
        return this.surface?.getCanvas() as Canvas;
    }

    public render(node?: SNode, surface?: Surface, isTemp?: boolean) {
        // console.time('render');
        const currentSurface = surface || this.surface;
        if (!currentSurface) {
            return;
        }
        const prevNode = this._currentRenderNode;
        if (node) {
            this._currentRenderNode = node;
        }

        if (!this._currentRenderNode) {
            return;
        }

        const canvas = currentSurface.getCanvas();
        canvas.clear([1, 1, 1, 1]);

        this.visitNode(
            this._currentRenderNode,
            (node) => {
                if (!node.activeInHierarchy) {
                    // console.log('node not active', node.name);
                    return;
                }
                const renderComps = node.getRenderComps();
                if (renderComps) {
                    renderComps.forEach((comp) => {
                        if (comp.isEnabled) {
                            comp.draw(canvas);
                        }
                    });
                }
                if (node.needClip) {
                    canvas.clipRect(
                        [
                            -node.width * node.anchor.x,
                            -node.height * node.anchor.y,
                            node.width * (1 - node.anchor.x),
                            node.height * (1 - node.anchor.y),
                        ],
                        CanvasKitModule.CanvasKit.ClipOp.Intersect,
                        true
                    );
                }
                if (node.preSelected) {
                    const rect = getRectByNode(node);
                    const globalScaleX = node.getGlobalScale().x;
                    if (globalScaleX !== this._prevGlobalScaleX) {
                        this._prevGlobalScaleX = globalScaleX;
                        this._preSelectedPaint!.setStrokeWidth(
                            2 / globalScaleX
                        );
                    }
                    rect[0] -= 2 / globalScaleX;
                    rect[1] -= 2 / globalScaleX;
                    rect[2] += 2 / globalScaleX;
                    rect[3] += 2 / globalScaleX;
                    canvas.drawRect(rect, this._preSelectedPaint!);
                }
            },
            (node) => {
                canvas.save();
                canvas.translate(node.position.x, node.position.y);
                canvas.rotate(node.rotation, 0, 0);
                canvas.scale(node.scale.x, node.scale.y);
            },
            (_node) => {
                canvas.restore();
            }
        );

        currentSurface.flush();
        if (isTemp) {
            this._currentRenderNode = prevNode;
        }
        // console.timeEnd('render');
    }

    public saveToImage(node: SNode): void {
        const renderTarget = this.getRenderTarget(node.width, node.height);

        if (!renderTarget) {
            return;
        }

        node.needClip = false;
        node.setTransform({
            position: new Vec2(node.width / 2, node.height / 2),
        });

        node.getRenderComps()?.forEach((comp) => {
            comp.disable();
        });
        this.render(node, renderTarget, true);
        node.getRenderComps()?.forEach((comp) => {
            comp.enable();
        });

        const image = renderTarget.makeImageSnapshot();
        const bytes = image.encodeToBytes(
            CanvasKitModule.CanvasKit.ImageFormat.PNG
        );
        if (bytes) {
            const blob = new Blob([bytes], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'snapshot.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }

        renderTarget.delete();
        node.needClip = true;
        node.setTransform({
            position: new Vec2(0, 0),
        });
    }

    public destroy() {
        this.resizeObserver.disconnect();
        this.surface?.delete();
        this.grContext?.delete();
        CanvasKitModule.CanvasKit.deleteContext(this._glContextHandle);
        eventBus.offReDraw(this.reDraw);
    }
}
