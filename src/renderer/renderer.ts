import type {
    Canvas,
    GrDirectContext,
    Surface,
    WebGLContextHandle,
} from 'canvaskit-wasm';

import SNode from './SNode';
import { CanvasKitModule } from '@/lib/canvaskit';
import { angleToRadians } from '@/common/util';
import EventEmitter from 'eventemitter3';
import { EventNames } from '@/common/types';

export class Renderer extends EventEmitter {
    private surface: Surface | null = null;

    private grContext: GrDirectContext | null = null;

    private _canvasElement: HTMLCanvasElement;
    private resizeObserver: ResizeObserver;

    private _currentRenderNode: SNode | null = null;
    private _glContextHandle: WebGLContextHandle;

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
                this.emit(EventNames.RESIZE, width, height);
            }
        });
        this.resizeObserver.observe(canvas);
    }

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
        canvas.clear([0, 0, 0, 0]);

        this.visitNode(
            this._currentRenderNode,
            node => {
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
                canvas.rotate(angleToRadians(node.rotation), 0, 0);
                canvas.scale(node.scale.x, node.scale.y);
            },
            node => {
                canvas.restore();
            }
        );
        this.surface.flush();
    }

    public destroy() {
        this.resizeObserver.disconnect();
        this.surface?.delete();
        this.grContext?.delete();
        CanvasKitModule.CanvasKit.deleteContext(this._glContextHandle);
    }
}
