import type { GrDirectContext, Surface } from 'canvaskit-wasm';

import SNode from './SNode';
import { CanvasKitModule } from '@/lib/canvaskit';
import { angleToRadians } from '@/common/util';

export class Renderer {
    private surface: Surface | null = null;

    private grContext: GrDirectContext | null = null;

    private _canvas: HTMLCanvasElement;
    private resizeObserver: ResizeObserver;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        const glContextHandle =
            CanvasKitModule.CanvasKit.GetWebGLContext(canvas);
        this.grContext =
            CanvasKitModule.CanvasKit.MakeWebGLContext(glContextHandle);
        if (!this.grContext) {
            throw new Error('Failed to create grContext');
        }

        this.surface = CanvasKitModule.CanvasKit.MakeOnScreenGLSurface(
            this.grContext,
            canvas.width,
            canvas.height,
            CanvasKitModule.CanvasKit.ColorSpace.SRGB
        );

        this.resizeObserver = new ResizeObserver(() => this.resizeSurface());
        this.resizeObserver.observe(canvas);
    }

    public resizeSurface() {
        const canvas = this._canvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

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

    public render(node: SNode) {
        if (!this.surface) {
            return;
        }

        console.log('render');

        const canvas = this.surface.getCanvas();
        canvas.clear([0, 0, 0, 0]);
        this.visitNode(
            node,
            node => {
                const renderComp = node.getRenderComps();
                canvas.translate(node.position.x, node.position.y);
                canvas.rotate(angleToRadians(node.rotation), 0, 0);
                canvas.scale(node.scale.x, node.scale.y);
                if (renderComp) {
                    renderComp.forEach(comp => {
                        comp.draw(canvas);
                    });
                }
            },
            _node => {
                canvas.save();
            },
            _node => {
                canvas.restore();
            }
        );
        this.surface.flush();
    }
}
