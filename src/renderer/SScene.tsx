import { EventNames, ISize, SceneOptions, SNodeConfig } from '@/common/types';
import SNode from './SNode';
import { createNodeFromConfig, refSNode } from './util';
import { Vec2 } from '@/common/Vec2';
import EventEmitter from 'eventemitter3';
import { createElement } from './createElement';
import { SceneX } from './UIComponent/SceneX';

export class SScene extends EventEmitter {
    public rootNode: SNode;

    private availableSize: ISize;

    private virtualCanvasRef: SNodeConfig.IRefSNode;

    private leftSideRef: SNodeConfig.IRefSNode;

    private rightSideRef: SNodeConfig.IRefSNode;

    private topLayerRef: SNodeConfig.IRefSNode;

    private bottomLayerRef: SNodeConfig.IRefSNode;

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

    constructor(option: SceneOptions) {
        super();
        this.option = option;
        this.availableSize = {
            width: option.canvasSize.width - option.sideWidth * 2,
            height: option.canvasSize.height,
        };

        const virtualCanvasScale = this.getVirtualCanvasScale();

        this.virtualCanvasRef = refSNode();
        this.leftSideRef = refSNode();
        this.rightSideRef = refSNode();
        this.topLayerRef = refSNode();
        this.bottomLayerRef = refSNode();
        this.canvasContainerRef = refSNode();

        const rootNodeConfig = (
            <SceneX
                canvasSize={this.option.canvasSize}
                designSize={this.option.designSize}
                sideWidth={this.option.sideWidth}
                virtualCanvasScale={virtualCanvasScale}
                canvasContainerRef={this.canvasContainerRef}
                bottomLayerRef={this.bottomLayerRef}
                virtualCanvasRef={this.virtualCanvasRef}
                topLayerRef={this.topLayerRef}
                leftSideRef={this.leftSideRef}
                rightSideRef={this.rightSideRef}
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

        const padding = this.availableSize.width * 0.1;
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

        const virtualCanvasScale = this.getVirtualCanvasScale();
        const canvasContainer = this.canvasContainerRef.value!;

        const leftSide = this.leftSideRef.value!;
        const rightSide = this.rightSideRef.value!;

        this.rootNode.setTransform({
            position: new Vec2(canvasSize.width / 2, canvasSize.height / 2),
        });
        this.rootNode.width = canvasSize.width;
        this.rootNode.height = canvasSize.height;

        leftSide.setTransform({
            position: new Vec2(-canvasSize.width / 2, -canvasSize.height / 2),
        });
        rightSide.setTransform({
            position: new Vec2(canvasSize.width / 2, -canvasSize.height / 2),
        });

        console.log('virtualCanvasScale', virtualCanvasScale);
        canvasContainer.setTransform({
            scale: virtualCanvasScale,
        });

        this.emit(EventNames.RESIZE, virtualCanvasScale);
    }
}
