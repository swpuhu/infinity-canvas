import { ISize, SceneOptions } from '@/common/types';
import SNode from './SNode';
import { createNodeFromConfig, IRefSNode, refSNode } from './util';
import { Vec2 } from '@/common/Vec2';

export class SScene {
    public rootNode: SNode;

    private availableSize: ISize;

    private virtualCanvasRef: IRefSNode;

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
                    style: {
                        fill: 0xff0000,
                    },
                    transform: {
                        scale: virtualCanvasScale,
                    },
                    width: this.option.designSize.width,
                    height: this.option.designSize.height,
                },
                {
                    name: 'left-side',
                    type: 'rect',
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
}
