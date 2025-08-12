import { IPoint, ISize, SNodeConfig } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { createElement } from '../createElement';

export function WhiteboardSceneX(option: {
    canvasSize: ISize;
    designSize: ISize;
    virtualCanvasScale: IPoint;
    canvasContainerRef: SNodeConfig.IRefSNode;
    virtualCanvasRef: SNodeConfig.IRefSNode;
    topLayerRef: SNodeConfig.IRefSNode;
    outerContainerRef: SNodeConfig.IRefSNode;
}) {
    console.log('option.designSize.height', option.designSize.height);
    const root = (
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
            <container name="outer-container" ref={option.outerContainerRef}>
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
                        style={{
                            fill: 0xffffee,
                        }}
                        width={option.designSize.width}
                        height={option.designSize.height}
                    >
                        <iarrow
                            name="iarrow"
                            width={200}
                            height={20}
                            style={{
                                fill: 0x777777,
                            }}
                            points={[
                                [0, 0],
                                [500, 0],
                                [500, 200],
                            ]}
                        />
                    </rect>
                </container>
                <container
                    name="top-layer"
                    ref={option.topLayerRef}
                    transform={{
                        position: new Vec2(0, 0),
                    }}
                ></container>
            </container>
        </container>
    );

    return root;
}
