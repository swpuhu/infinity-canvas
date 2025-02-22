import { IPoint, ISize, SNodeConfig } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { createElement } from '../createElement';

export function SceneX(option: {
    canvasSize: ISize;
    designSize: ISize;
    sideWidth: number;
    virtualCanvasScale: IPoint;
    canvasContainerRef: SNodeConfig.IRefSNode;
    bottomLayerRef: SNodeConfig.IRefSNode;
    virtualCanvasRef: SNodeConfig.IRefSNode;
    topLayerRef: SNodeConfig.IRefSNode;
    leftSideRef: SNodeConfig.IRefSNode;
    rightSideRef: SNodeConfig.IRefSNode;
}) {
    return (
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
                    scale: option.virtualCanvasScale,
                }}
                ref={option.canvasContainerRef}
            >
                <rect
                    name="virtualCanvas"
                    props={{
                        width: option.designSize.width,
                        height: option.designSize.height,
                    }}
                    ref={option.virtualCanvasRef}
                    needClip={true}
                    style={{
                        fill: 0xffffff,
                        shadow: {
                            color: 0xaaaaaa,
                            blur: 10,
                        },
                    }}
                    width={option.designSize.width}
                    height={option.designSize.height}
                ></rect>
                <container
                    name="top-layer"
                    ref={option.topLayerRef}
                    transform={{
                        position: new Vec2(0, 0),
                    }}
                ></container>
            </container>
            <rect
                name="left-side"
                ref={option.leftSideRef}
                width={option.sideWidth}
                height={option.canvasSize.height}
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
                ref={option.rightSideRef}
                width={option.sideWidth}
                height={option.canvasSize.height}
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
}
