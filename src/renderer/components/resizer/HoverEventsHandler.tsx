import { CanvasEditor } from '@/renderer/Editor';
import { GIZMO_DIRECTIONS, ResizerUI } from './ResizerUI';
import { EventNames } from '@/common/types';
import { Path } from 'canvaskit-wasm';
import { CanvasKitModule } from '@/lib/canvaskit';
import SNode from '@/renderer/SNode';
import { createElement } from '@/renderer/createElement';
import { createNodeFromConfig } from '@/renderer/util';
import { DEFAULT_SHAPE_STYLE } from '@/common/const';

export class HoverEventsHandler {
    private _tempArrowAndNode: SNode | null = null;
    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        this._bindEvents();
    }

    private _createArrowPath(
        srcNode: SNode,
        direction: GIZMO_DIRECTIONS
    ): SNode {
        console.log(srcNode.width, srcNode.height);
        const OFFSET = 200;
        const ARROW_HEIGHT = 20;
        let arrowWidth = OFFSET;
        let arrowHeight = ARROW_HEIGHT;
        let arrowRotation = 0;

        // 计算源节点的边界点
        const srcNodeBounds = {
            left: srcNode.position.x - srcNode.width * srcNode.anchor.x,
            right: srcNode.position.x + srcNode.width * (1 - srcNode.anchor.x),
            top: srcNode.position.y + srcNode.height * srcNode.anchor.y,
            bottom:
                srcNode.position.y - srcNode.height * (1 - srcNode.anchor.y),
        };

        const nodeNextPosition = srcNode.position.clone();
        let arrowNextPosition = srcNode.position.clone();

        switch (direction) {
            case GIZMO_DIRECTIONS.LEFT:
                // 新节点在左侧
                nodeNextPosition.x =
                    srcNodeBounds.left -
                    OFFSET -
                    srcNode.width * srcNode.anchor.x;
                // 箭头从源节点左边缘开始，指向左侧
                arrowNextPosition.x = srcNodeBounds.left;
                arrowNextPosition.y = srcNode.position.y;
                arrowRotation = 180; // 箭头向左
                break;

            case GIZMO_DIRECTIONS.RIGHT:
                // 新节点在右侧
                nodeNextPosition.x =
                    srcNodeBounds.right +
                    OFFSET +
                    srcNode.width * (1 - srcNode.anchor.x);
                // 箭头从源节点右边缘开始，指向右侧
                arrowNextPosition.x = srcNodeBounds.right;
                arrowNextPosition.y = srcNode.position.y;
                arrowRotation = 0; // 箭头向右
                break;

            case GIZMO_DIRECTIONS.TOP:
                // 新节点在上方（y坐标更小）
                nodeNextPosition.y =
                    srcNodeBounds.top +
                    OFFSET +
                    srcNode.height * srcNode.anchor.y;
                // 箭头从源节点上边缘开始，指向上方
                arrowNextPosition.x = srcNode.position.x;
                arrowNextPosition.y = srcNodeBounds.top;
                arrowRotation = 90; // 箭头向上（在y轴向下的坐标系中）
                break;

            case GIZMO_DIRECTIONS.BOTTOM:
                // 新节点在下方（y坐标更大）
                nodeNextPosition.y =
                    srcNodeBounds.bottom -
                    OFFSET -
                    srcNode.height * (1 - srcNode.anchor.y);
                // 箭头从源节点下边缘开始，指向下方
                arrowNextPosition.x = srcNode.position.x;
                arrowNextPosition.y = srcNodeBounds.bottom;
                arrowRotation = 270; // 箭头向下（在y轴向下的坐标系中）
                break;
        }
        const config = (
            <container>
                <arrow
                    width={arrowWidth}
                    height={arrowHeight}
                    transform={{
                        anchor: {
                            x: 0,
                            y: 0.5,
                        },
                        position: arrowNextPosition,
                        rotation: arrowRotation,
                    }}
                    style={{
                        fill: 0x777777,
                    }}
                />
                <rect
                    width={srcNode.width}
                    height={srcNode.height}
                    transform={{
                        position: nodeNextPosition,
                        anchor: {
                            x: srcNode.anchor.x,
                            y: srcNode.anchor.y,
                        },
                    }}
                    style={DEFAULT_SHAPE_STYLE}
                />
            </container>
        );

        return createNodeFromConfig(config);
    }

    private _bindEvents(): void {
        this._resizerUI.on(
            EventNames.ADD_SHAPE_HOVERED,
            (node: SNode, direction: GIZMO_DIRECTIONS) => {
                const arrow = this._createArrowPath(node, direction);

                const canvasNode = this._editor.scene.getCanvasNode();
                canvasNode.addChild(arrow);

                this._tempArrowAndNode = arrow;
            }
        );

        this._resizerUI.on(EventNames.ADD_SHAPE_UNHOVERED, () => {
            if (this._tempArrowAndNode) {
                this._tempArrowAndNode.destroy();
                this._tempArrowAndNode = null;
            }
        });
    }
}
