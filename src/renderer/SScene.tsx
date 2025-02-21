import { EventNames, ISize, SceneOptions, SNodeConfig } from '@/common/types';
import SNode from './SNode';
import { createNodeFromConfig, refSNode } from './util';
import { Vec2 } from '@/common/Vec2';
import EventEmitter from 'eventemitter3';
import { createElement } from './createElement';

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
        console.log('option', option);
        this.option = option;
        this.availableSize = {
            width: option.canvasSize.width - option.sideWidth * 2,
            height: option.canvasSize.height,
        };

        const virtualCanvasScale = this.getVirtualCanvasScale();
        console.log('virtualCanvasScale', virtualCanvasScale);

        this.virtualCanvasRef = refSNode();
        this.leftSideRef = refSNode();
        this.rightSideRef = refSNode();
        this.topLayerRef = refSNode();
        this.bottomLayerRef = refSNode();
        this.canvasContainerRef = refSNode();

        const rootNodeConfig = (
            <container
                name="root"
                width={option.canvasSize.width}
                height={option.canvasSize.height}
                transform={{
                    position: new Vec2(
                        option.canvasSize.width / 2,
                        option.canvasSize.height / 2
                    ),
                }}
            >
                <container
                    name="canvas-container"
                    transform={{
                        scale: virtualCanvasScale,
                    }}
                    ref={this.canvasContainerRef}
                >
                    <rect
                        name="virtualCanvas"
                        props={{
                            width: this.option.designSize.width,
                            height: this.option.designSize.height,
                        }}
                        needClip={true}
                        style={{
                            fill: 0xffffff,
                            shadow: {
                                color: 0xaaaaaa,
                                blur: 10,
                            },
                        }}
                        width={this.option.designSize.width}
                        height={this.option.designSize.height}
                    >
                        <container
                            name="bottom-layer"
                            ref={this.bottomLayerRef}
                            width={this.option.designSize.width}
                            height={this.option.designSize.height}
                        />
                        <container
                            name="content-node"
                            ref={this.virtualCanvasRef}
                            width={this.option.designSize.width}
                            height={this.option.designSize.height}
                        />
                    </rect>
                    <container
                        name="top-layer"
                        ref={this.topLayerRef}
                        transform={{
                            position: new Vec2(0, 0),
                        }}
                    />
                </container>
                <rect
                    name="left-side"
                    ref={this.leftSideRef}
                    width={this.option.sideWidth}
                    height={this.option.canvasSize.height}
                    style={{
                        fill: 0xcccccc,
                    }}
                    transform={{
                        position: new Vec2(
                            -option.canvasSize.width / 2,
                            -option.canvasSize.height / 2
                        ),
                        anchor: new Vec2(0, 0),
                    }}
                />
                <rect
                    name="right-side"
                    ref={this.rightSideRef}
                    width={this.option.sideWidth}
                    height={this.option.canvasSize.height}
                    style={{
                        fill: 0xcccccc,
                    }}
                    transform={{
                        position: new Vec2(
                            option.canvasSize.width / 2,
                            -option.canvasSize.height / 2
                        ),
                        anchor: new Vec2(1, 0),
                    }}
                />
            </container>
        );

        console.log('rootNode', rootNodeConfig);
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

        canvasContainer.setTransform({
            scale: virtualCanvasScale,
        });

        this.emit(EventNames.RESIZE, virtualCanvasScale);
    }
}
