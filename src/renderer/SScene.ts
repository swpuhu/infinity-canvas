import { ISize, SceneOptions } from '@/common/types';
import SNode from './SNode';
import { createNodeFromConfig, IRefSNode, refSNode } from './util';
import { Vec2 } from '@/common/Vec2';

export class SScene {
    public rootNode: SNode;

    private availableSize: ISize;

    private virtualCanvasRef: IRefSNode;

    private leftSideRef: IRefSNode;

    private rightSideRef: IRefSNode;

    private option: SceneOptions;

    constructor(option: SceneOptions) {
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

        this.rootNode = createNodeFromConfig({
            name: 'root',
            type: 'container',
            transform: {
                position: new Vec2(
                    option.canvasSize.width / 2,
                    option.canvasSize.height / 2
                ),
            },
            children: [
                {
                    name: 'virtualCanvas',
                    type: 'rect',
                    ref: this.virtualCanvasRef,
                    props: {
                        width: this.option.designSize.width,
                        height: this.option.designSize.height,
                    },
                    needClip: true,
                    style: {
                        fill: 0xffffff,
                        shadow: {
                            color: 0xaaaaaa,
                            blur: 20,
                        },
                    },
                    transform: {
                        scale: virtualCanvasScale,
                    },
                    width: this.option.designSize.width,
                    height: this.option.designSize.height,
                    children: [
                        {
                            type: 'rect',
                            name: 'test-block',
                            props: {
                                width: 200,
                                height: 200,
                            },
                            transform: {
                                position: new Vec2(960, 0),
                            },
                            style: {
                                fill: 0xffbb00,
                            },
                        },
                    ],
                },
                {
                    name: 'left-side',
                    type: 'rect',
                    ref: this.leftSideRef,
                    props: {
                        width: this.option.sideWidth,
                        height: this.option.canvasSize.height,
                    },
                    style: {
                        fill: 0xcccccc,
                    },
                    transform: {
                        position: new Vec2(
                            -option.canvasSize.width / 2,
                            -option.canvasSize.height / 2
                        ),
                        anchor: new Vec2(0, 0),
                    },
                    width: this.option.sideWidth,
                    height: this.option.canvasSize.height,
                },
                {
                    name: 'right-side',
                    type: 'rect',
                    ref: this.rightSideRef,
                    props: {
                        width: this.option.sideWidth,
                        height: this.option.canvasSize.height,
                    },
                    style: {
                        fill: 0xcccccc,
                    },
                    transform: {
                        position: new Vec2(
                            option.canvasSize.width / 2,
                            -option.canvasSize.height / 2
                        ),
                        anchor: new Vec2(1, 0),
                    },
                    width: this.option.sideWidth,
                    height: this.option.canvasSize.height,
                },
            ],
        });
    }

    private getVirtualCanvasScale(): Vec2 {
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
        const virtualCanvas = this.virtualCanvasRef.value!;

        const leftSide = this.leftSideRef.value!;
        const rightSide = this.rightSideRef.value!;

        this.rootNode.setTransform({
            position: new Vec2(canvasSize.width / 2, canvasSize.height / 2),
        });

        leftSide.setTransform({
            position: new Vec2(-canvasSize.width / 2, -canvasSize.height / 2),
        });
        rightSide.setTransform({
            position: new Vec2(canvasSize.width / 2, -canvasSize.height / 2),
        });

        virtualCanvas.setTransform({
            scale: virtualCanvasScale,
        });
    }
}
