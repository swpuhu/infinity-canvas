import { EventNames, ISize, SceneOptions, SNodeConfig } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import EventEmitter from 'eventemitter3';
import { createElement } from './createElement';
import SNode from './SNode';
import { WhiteboardSceneX } from './UIComponent/WhiteboardSceneX';
import { createNodeFromConfig, refSNode } from './util';

export class WhiteboardScene extends EventEmitter {
    public rootNode: SNode;

    private availableSize: ISize;

    private virtualCanvasRef: SNodeConfig.IRefSNode;

    private topLayerRef: SNodeConfig.IRefSNode;

    private canvasContainerRef: SNodeConfig.IRefSNode;

    private option: SceneOptions;

    get stage(): SNode {
        return this.virtualCanvasRef.value!;
    }

    get topLayer(): SNode {
        return this.topLayerRef.value!;
    }

    get canvasLayer(): SNode {
        return this.virtualCanvasRef.value!;
    }

    get canvasContainer(): SNode {
        return this.canvasContainerRef.value!;
    }

    constructor(option: SceneOptions) {
        super();
        this.option = option;
        this.availableSize = {
            width: option.canvasSize.width - option.sideWidth * 2,
            height: option.canvasSize.height,
        };

        const virtualCanvasScale = this.getVirtualCanvasScale();

        this.virtualCanvasRef = refSNode();
        this.topLayerRef = refSNode();
        this.canvasContainerRef = refSNode();

        const rootNodeConfig = (
            <WhiteboardSceneX
                canvasSize={this.option.canvasSize}
                designSize={this.option.designSize}
                virtualCanvasScale={virtualCanvasScale}
                canvasContainerRef={this.canvasContainerRef}
                virtualCanvasRef={this.virtualCanvasRef}
                topLayerRef={this.topLayerRef}
            />
        );

        this.rootNode = createNodeFromConfig(rootNodeConfig);
    }

    public getCanvasNode(): SNode {
        return this.virtualCanvasRef.value!;
    }

    public getVirtualCanvasScale(): Vec2 {
        // the aspect = width / height
        // virtual canvas size equal to design size
        // if the aspect of virtual canvas is less than the aspect of available area,
        // adapt to the fit-width area
        // reverse, adapt to the fit-height area
        const aspect = this.availableSize.width / this.availableSize.height;

        const padding = 0;
        const designAspect =
            this.option.designSize.width / this.option.designSize.height;
        if (aspect > designAspect) {
            const scale =
                (this.availableSize.height - padding) /
                this.option.designSize.height;
            return new Vec2(scale, scale);
        }
        const scale =
            (this.availableSize.width - padding) / this.option.designSize.width;
        return new Vec2(scale, scale);
    }

    public resizeCanvasSize(canvasSize: ISize) {
        this.availableSize = {
            width: canvasSize.width - this.option.sideWidth * 2,
            height: canvasSize.height,
        };
        console.log('resizeCanvasSize', this.availableSize);

        const virtualCanvasScale = this.getVirtualCanvasScale();
        const canvasContainer = this.canvasContainerRef.value!;

        this.rootNode.setTransform({
            position: new Vec2(canvasSize.width / 2, canvasSize.height / 2),
        });
        this.rootNode.width = canvasSize.width;
        this.rootNode.height = canvasSize.height;

        console.log('virtualCanvasScale', virtualCanvasScale);
        canvasContainer.setTransform({
            scale: virtualCanvasScale,
        });

        this.emit(EventNames.RESIZE, virtualCanvasScale);
    }

    public getAllNodes(): ReadonlyArray<SNode> {
        return this.virtualCanvasRef.value!.children;
    }
}
