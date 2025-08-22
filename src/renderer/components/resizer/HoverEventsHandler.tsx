import { CanvasEditor } from '@/renderer/Editor';
import { ResizerUI } from './ResizerUI';
import { EventNames, SNodeConfig } from '@/common/types';
import SNode from '@/renderer/SNode';
import { createElement } from '@/renderer/createElement';
import { createNodeFromConfig } from '@/renderer/util';
import {
    DEFAULT_SHADOW_ALPHA,
    DEFAULT_SHADOW_SHAPE_STYLE,
} from '@/common/const';
import { vec2 } from 'gl-matrix';
import { getMidPoint } from '@/common/util';
import { SGeo } from '@/renderer/Geometry/SGeo';

export class HoverEventsHandler {
    private _tempArrowAndNode: SNode | null = null;

    private _canvasNode: SNode | null = null;
    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        this._bindEvents();
        this._canvasNode = this._editor.scene.getCanvasNode();
    }

    private _createArrowPath(
        srcNode: SNode,
        direction: SNodeConfig.ShapeHoverDir
    ): SNode {
        console.log(srcNode.width, srcNode.height);
        const OFFSET = 200;
        const ARROW_HEIGHT = 20;

        // 计算源节点的边界点
        const [wLB, wLT, wRB, wRT] = srcNode.getWorldPoints();
        let midWorldPoint: vec2 = vec2.create();
        switch (direction.originDir) {
            case SNodeConfig.GIZMO_DIRECTIONS.LEFT:
                midWorldPoint = getMidPoint(wLB, wLT);
                break;
            case SNodeConfig.GIZMO_DIRECTIONS.RIGHT:
                midWorldPoint = getMidPoint(wRB, wRT);
                break;
            case SNodeConfig.GIZMO_DIRECTIONS.TOP:
                midWorldPoint = getMidPoint(wLT, wRT);
                break;
            case SNodeConfig.GIZMO_DIRECTIONS.BOTTOM:
                midWorldPoint = getMidPoint(wLB, wRB);
                break;
            default:
                break;
        }

        const midPoint = this._canvasNode!.toLocal(midWorldPoint);

        const nodeNextPosition = vec2.clone(midPoint);

        const dirVec = vec2.scale(vec2.create(), direction.vec, OFFSET);
        vec2.add(nodeNextPosition, nodeNextPosition, dirVec);
        const arrowPoints = [midPoint, nodeNextPosition];
        // 箭头 points: 从(0,0)到(width,0)，与 anchor x:0, y:0.5 配合
        const shadowShape = srcNode.clone();
        const config = (
            <container>
                <iarrow
                    points={arrowPoints}
                    style={{
                        fill: 0x777777,
                    }}
                />
            </container>
        );

        const node = createNodeFromConfig(config);
        const geo = shadowShape.getComponent(SGeo);
        geo?.setAlpha(DEFAULT_SHADOW_ALPHA);
        shadowShape.position.set(nodeNextPosition[0], nodeNextPosition[1]);
        node.addChild(shadowShape);
        return node;
    }

    private _bindEvents(): void {
        this._resizerUI.on(
            EventNames.ADD_SHAPE_HOVERED,
            this._onAddShapeHovered
        );

        this._resizerUI.on(
            EventNames.ADD_SHAPE_UNHOVERED,
            this._onAddShapeUnhovered
        );

        this._resizerUI.on(
            EventNames.ADD_SHAPE_CLICKED,
            this._onAddShapeClicked
        );
    }

    private _onAddShapeHovered = (
        node: SNode,
        direction: SNodeConfig.ShapeHoverDir
    ) => {
        const arrow = this._createArrowPath(node, direction);

        const canvasNode = this._editor.scene.getCanvasNode();
        canvasNode.addChild(arrow);

        this._tempArrowAndNode = arrow;
    };

    private _onAddShapeUnhovered = () => {
        if (this._tempArrowAndNode) {
            this._tempArrowAndNode.destroy();
            this._tempArrowAndNode = null;
        }
    };

    private _onAddShapeClicked = (
        node: SNode,
        direction: SNodeConfig.GIZMO_DIRECTIONS
    ) => {
        console.log('onAddShapeClicked', node, direction);
    };
}
