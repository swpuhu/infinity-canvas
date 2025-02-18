import type {
    Canvas,
    GrDirectContext,
    Surface,
    WebGLContextHandle,
} from 'canvaskit-wasm';

import SNode from './SNode';
import { CanvasKitModule } from '@/lib/canvaskit';
import { angleToRadians, loadImage } from '@/common/util';
import EventEmitter from 'eventemitter3';
import { EventNames } from '@/common/types';
import eventBus from '@/common/eventBus';

export class Renderer extends EventEmitter {
    private surface: Surface | null = null;

    private grContext: GrDirectContext | null = null;

    private _canvasElement: HTMLCanvasElement;
    private resizeObserver: ResizeObserver;

    private _currentRenderNode: SNode | null = null;
    private _glContextHandle: WebGLContextHandle;

    private needRedraw = false;

    constructor(canvas: HTMLCanvasElement) {
        super();
        this._canvasElement = canvas;
        this._glContextHandle =
            CanvasKitModule.CanvasKit.GetWebGLContext(canvas);

        console.log('width', canvas.width, 'height', canvas.height);
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

        this.resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                this.resizeSurface(width, height);
                setTimeout(() => {
                    this.emit(EventNames.RESIZE, width, height);
                }, 100);
            }
        });
        this.resizeObserver.observe(canvas);
        this.startCheckRedraw();

        eventBus.onReDraw(this.reDraw);
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
        const canvas = this._canvasElement;

        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;

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

    public render(node?: SNode) {
        // console.time('render');
        if (!this.surface) {
            return;
        }
        if (node) {
            this._currentRenderNode = node;
        }

        if (!this._currentRenderNode) {
            return;
        }

        const canvas = this.surface.getCanvas();
        canvas.clear([1, 1, 1, 1]);

        this.visitNode(
            this._currentRenderNode,
            node => {
                if (!node.activeInHierarchy) {
                    // console.log('node not active', node.name);
                    return;
                }
                const renderComp = node.getRenderComps();
                if (renderComp) {
                    renderComp.forEach(comp => {
                        comp.draw(canvas);
                    });
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
                }
            },
            node => {
                canvas.save();
                canvas.translate(node.position.x, node.position.y);
                canvas.rotate(node.rotation, 0, 0);
                canvas.scale(node.scale.x, node.scale.y);
            },
            node => {
                canvas.restore();
            }
        );

        this.surface.flush();
        // console.timeEnd('render');
    }

    public destroy() {
        this.resizeObserver.disconnect();
        this.surface?.delete();
        this.grContext?.delete();
        CanvasKitModule.CanvasKit.deleteContext(this._glContextHandle);
        eventBus.offReDraw(this.reDraw);
    }
}
