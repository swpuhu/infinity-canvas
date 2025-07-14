import { createNodeFromConfig } from '@/renderer/util';

import {
    EventNames,
    IPointData,
    ResizeDirection,
    SNodeConfig,
    SNodeEvents,
} from '@/common/types';
import { decomposeMatrix } from '@/common/util';
import { createElement } from '@/renderer/createElement';
import SNode from '@/renderer/SNode';
import { refSNode } from '@/renderer/util';
import { WhiteboardScene } from '@/renderer/WhiteboardScene';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';
import EventEmitter from 'eventemitter3';

const RESIZE_GIZMO_SIZE = 10;
const ADD_SHAPE_GIZMO_SIZE = 10;
const ROTATE_GIZMO_SIZE = 8;
const RESIZE_GIZMO_FILL_COLOR = 0xffffff;
const RESIZE_GIZMO_STROKE_COLOR = 0x3670f4;
const SHAPE_GIZMO_COLOR = 0xbbcffd;
const SHAPE_GIZMO_HOVER_COLOR = 0x5b8df7; // 高亮颜色
const SHAPE_GIZMO_OFFSET = 20;

const GIZMO_LINE_WIDTH = 2;
const GIZMO_LINE_HOVER_WIDTH = 10;
const GIZMO_LINE_COLOR = 0x3670f4;
export enum GIZMO_DIRECTIONS {
    LEFT = 'left',
    RIGHT = 'right',
    TOP = 'top',
    BOTTOM = 'bottom',
}

// 通用样式配置
const blockStyle = {
    fill: RESIZE_GIZMO_FILL_COLOR,
    stroke: RESIZE_GIZMO_STROKE_COLOR,
    strokeWidth: 1,
};
const lineStyle = { fill: GIZMO_LINE_COLOR };
const CommonResizePoint = (props: {
    name: string;
    ref: SNodeConfig.IRefSNode;
}) => {
    return (
        <rect
            name={props.name}
            ref={props.ref}
            style={blockStyle}
            width={RESIZE_GIZMO_SIZE}
            height={RESIZE_GIZMO_SIZE}
        ></rect>
    );
};
const Line = (props: {
    name: string;
    ref: SNodeConfig.IRefSNode;
    containerRef: SNodeConfig.IRefSNode;
    anchor: IPointData;
}) => {
    return (
        <container
            name={props.name}
            ref={props.containerRef}
            transform={{ anchor: props.anchor }}
        >
            <rect
                name={`${props.name}-line`}
                ref={props.ref}
                style={lineStyle}
                transform={{ anchor: props.anchor }}
            ></rect>
        </container>
    );
};

const AddShapeNode = (props: { name: string; ref: SNodeConfig.IRefSNode }) => {
    return (
        <ellipse
            name={props.name}
            ref={props.ref}
            style={{ fill: SHAPE_GIZMO_COLOR }}
            width={ADD_SHAPE_GIZMO_SIZE}
            height={ADD_SHAPE_GIZMO_SIZE}
        ></ellipse>
    );
};

export class ResizerUI {
    private _root: SNode | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();

    private _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rtNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _dummyRef: SNodeConfig.IRefSNode = refSNode();

    private _leftLineRef: SNodeConfig.IRefSNode = refSNode();
    private _rightLineRef: SNodeConfig.IRefSNode = refSNode();
    private _topLineRef: SNodeConfig.IRefSNode = refSNode();
    private _bottomLineRef: SNodeConfig.IRefSNode = refSNode();

    private _leftLineContainerRef: SNodeConfig.IRefSNode = refSNode();
    private _rightLineContainerRef: SNodeConfig.IRefSNode = refSNode();
    private _topLineContainerRef: SNodeConfig.IRefSNode = refSNode();
    private _bottomLineContainerRef: SNodeConfig.IRefSNode = refSNode();

    private _leftAddShapeRef: SNodeConfig.IRefSNode = refSNode();
    private _rightAddShapeRef: SNodeConfig.IRefSNode = refSNode();
    private _topAddShapeRef: SNodeConfig.IRefSNode = refSNode();
    private _bottomAddShapeRef: SNodeConfig.IRefSNode = refSNode();

    private _resizeHandlerNodes: SNode[] = [];
    private _rotateHandlerNodes: SNode[] = [];
    private _lineContainers: SNode[] = [];
    private _addShapeNodes: SNode[] = [];

    public on(event: string, callback: (...args: any[]) => void): void {
        this._eventEmitter.on(event, callback);
    }

    private _emit(event: string, ...args: any[]): void {
        this._eventEmitter.emit(event, ...args);
    }

    private _rotateRefs: SNodeConfig.IRefSNode[] = [
        refSNode(),
        refSNode(),
        refSNode(),
        refSNode(),
    ];

    private _editorModeStore = useEditorModeStore();

    private _prevHoveredNode: SNode | null = null;
    private _prevHoveredAddShapeNode: SNode | null = null;

    get resizeHandlerNodes(): SNode[] {
        return this._resizeHandlerNodes;
    }

    get resizeLineHandlerNodes(): SNode[] {
        return this._lineContainers;
    }

    get leftLineNode(): SNode {
        return this._leftLineContainerRef.value!;
    }

    get rightLineNode(): SNode {
        return this._rightLineContainerRef.value!;
    }

    get topLineNode(): SNode {
        return this._topLineContainerRef.value!;
    }

    get bottomLineNode(): SNode {
        return this._bottomLineContainerRef.value!;
    }

    get lbNode(): SNode {
        return this._lbNodeRef.value!;
    }

    get ltNode(): SNode {
        return this._ltNodeRef.value!;
    }

    get rbNode(): SNode {
        return this._rbNodeRef.value!;
    }

    get rtNode(): SNode {
        return this._rtNodeRef.value!;
    }

    get rotateNodes(): SNode[] {
        return this._rotateHandlerNodes;
    }

    get leftAddShapeNode(): SNode {
        return this._leftAddShapeRef.value!;
    }
    get rightAddShapeNode(): SNode {
        return this._rightAddShapeRef.value!;
    }
    get topAddShapeNode(): SNode {
        return this._topAddShapeRef.value!;
    }
    get bottomAddShapeNode(): SNode {
        return this._bottomAddShapeRef.value!;
    }

    constructor(private _scene: WhiteboardScene) {
        this._createHandler();

        this._scene.on(EventNames.RESIZE, this._onResize);
        this._bindEvents();
    }

    private _bindEvents(): void {
        this.rotateNodes.forEach((node) => {
            CanvasEventSystem.instance.addEventListener(
                node,
                SNodeEvents.PURE_POINTER_MOVE,
                this._onPointerMove
            );
        });
        this.resizeHandlerNodes.forEach((node) => {
            CanvasEventSystem.instance.addEventListener(
                node,
                SNodeEvents.PURE_POINTER_MOVE,
                this._onPointerMove
            );
        });

        // 为add-shape节点添加hover事件监听
        const addShapeNodes = [
            this.leftAddShapeNode,
            this.rightAddShapeNode,
            this.topAddShapeNode,
            this.bottomAddShapeNode,
        ];

        const lineContainers = [
            this._leftLineContainerRef.value!,
            this._rightLineContainerRef.value!,
            this._topLineContainerRef.value!,
            this._bottomLineContainerRef.value!,
        ];

        addShapeNodes.forEach((node) => {
            CanvasEventSystem.instance.addEventListener(
                node,
                SNodeEvents.PURE_POINTER_MOVE,
                this._onPointerMove
            );
        });

        lineContainers.forEach((node) => {
            CanvasEventSystem.instance.addEventListener(
                node,
                SNodeEvents.PURE_POINTER_MOVE,
                this._onPointerMove
            );
        });

        CanvasEventSystem.instance.addEventListener(
            this._scene.getCanvasNode(),
            SNodeEvents.PURE_POINTER_MOVE,
            this._onPointerMove
        );
    }

    private _onPointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        const currentTarget = event.currentTarget;
        const currentMode = this._editorModeStore.currentMode;
        if (!this.node.active) {
            return;
        }
        if (
            currentMode !== EditorMode.DEFAULT &&
            currentMode !== EditorMode.PRE_ROTATE &&
            currentMode !== EditorMode.PRE_RESIZE
        ) {
            return;
        }
        if (!currentTarget) {
            return;
        }

        // 处理add-shape节点的hover效果
        const addShapeNodes = [
            this.leftAddShapeNode,
            this.rightAddShapeNode,
            this.topAddShapeNode,
            this.bottomAddShapeNode,
        ];

        const isAddShapeNode = addShapeNodes.includes(currentTarget);

        // 如果当前hover的add-shape节点发生变化
        if (this._prevHoveredAddShapeNode !== currentTarget) {
            // 恢复之前hover节点的颜色
            if (
                this._prevHoveredAddShapeNode &&
                addShapeNodes.includes(this._prevHoveredAddShapeNode)
            ) {
                this.onAddShapeNodeHover(this._prevHoveredAddShapeNode, false);
            }

            // 设置当前hover节点的颜色
            if (isAddShapeNode) {
                this.onAddShapeNodeHover(currentTarget, true);
                this._prevHoveredAddShapeNode = currentTarget;
            } else {
                this._prevHoveredAddShapeNode = null;
            }
        }

        const rotateNodeIndex = this.rotateNodes.indexOf(currentTarget);
        const resizerNodeIndex = this.resizeHandlerNodes.indexOf(currentTarget);
        const lineContainerIndex = this._lineContainers.indexOf(currentTarget);

        if (rotateNodeIndex !== -1) {
            const direction = this._getResizerDirection(rotateNodeIndex);
            // console.log('currentTarget', currentTarget.name, direction);
            this._editorModeStore.setMode(EditorMode.PRE_ROTATE, direction);
        } else if (resizerNodeIndex !== -1) {
            const direction = this._getResizerDirection(resizerNodeIndex);
            // console.log('currentTarget', currentTarget.name, direction);
            this._editorModeStore.setMode(EditorMode.PRE_RESIZE, direction);
        } else if (lineContainerIndex !== -1) {
            const direction = this._getLineDirection(lineContainerIndex);
            // console.log('currentTarget', currentTarget.name, direction);
            this._editorModeStore.setMode(EditorMode.PRE_RESIZE, direction);
        } else if (
            this._prevHoveredNode !== currentTarget &&
            currentTarget === this._scene.getCanvasNode()
        ) {
            this._editorModeStore.setMode(EditorMode.DEFAULT);
        }
        this._prevHoveredNode = currentTarget;
    };

    private _getLineDirection(nodeIndex: number): ResizeDirection {
        /**
         * 0 -> left / west
         * 1 -> right / east
         * 2 -> bottom / north
         * 3 -> top / south
         */
        return nodeIndex === 0
            ? 'w'
            : nodeIndex === 1
            ? 'e'
            : nodeIndex === 2
            ? 'n'
            : 's';
    }

    private _getResizerDirection(nodeIndex: number): ResizeDirection {
        // index 0 -> lb
        // index 1 -> lt
        // index 2 -> rb
        // index 3 -> rt
        return nodeIndex === 0
            ? 'nw'
            : nodeIndex === 1
            ? 'sw'
            : nodeIndex === 2
            ? 'ne'
            : 'se';
    }

    private _getAddShapeNodeDirection(nodeIndex: number): GIZMO_DIRECTIONS {
        return nodeIndex === 0
            ? GIZMO_DIRECTIONS.LEFT
            : nodeIndex === 1
            ? GIZMO_DIRECTIONS.RIGHT
            : nodeIndex === 2
            ? GIZMO_DIRECTIONS.TOP
            : GIZMO_DIRECTIONS.BOTTOM;
    }

    get node() {
        if (!this._root) {
            throw new Error('node is not initialized');
        }
        return this._root;
    }

    get dummyNode(): SNode {
        if (!this._dummyRef.value) {
            throw new Error('dummyNode is not initialized');
        }
        return this._dummyRef.value;
    }

    private _createHandler(): void {
        // 创建控制点
        const controlPoints = [
            { name: 'left-bottom', ref: this._lbNodeRef },
            { name: 'left-top', ref: this._ltNodeRef },
            { name: 'right-bottom', ref: this._rbNodeRef },
            { name: 'right-top', ref: this._rtNodeRef },
        ];

        const rotatePoints = [
            { name: 'rotate-point1', ref: this._rotateRefs[0] },
            { name: 'rotate-point2', ref: this._rotateRefs[1] },
            { name: 'rotate-point3', ref: this._rotateRefs[2] },
            { name: 'rotate-point4', ref: this._rotateRefs[3] },
        ];

        const rootConfig = (
            <container name="resize-gizmo" active={false}>
                <container name="lines">
                    <Line
                        name="left-line"
                        ref={this._leftLineRef}
                        containerRef={this._leftLineContainerRef}
                        anchor={{ x: 0.5, y: 0 }}
                    />
                    <Line
                        name="right-line"
                        ref={this._rightLineRef}
                        containerRef={this._rightLineContainerRef}
                        anchor={{ x: 0.5, y: 1 }}
                    />
                    <Line
                        name="top-line"
                        ref={this._topLineRef}
                        containerRef={this._topLineContainerRef}
                        anchor={{ x: 1, y: 0.5 }}
                    />
                    <Line
                        name="bottom-line"
                        ref={this._bottomLineRef}
                        containerRef={this._bottomLineContainerRef}
                        anchor={{ x: 0, y: 0.5 }}
                    />
                </container>
                <container name="resize-points">
                    {controlPoints.map((p) => (
                        <CommonResizePoint name={p.name} ref={p.ref} />
                    ))}
                </container>
                <container name="rotate-points">
                    {rotatePoints.map((p) => (
                        <ellipse
                            name={p.name}
                            ref={p.ref}
                            width={ROTATE_GIZMO_SIZE}
                            height={ROTATE_GIZMO_SIZE}
                            style={{
                                alpha: 0,
                            }}
                        />
                    ))}
                </container>
                <container name="add-shape-points">
                    <AddShapeNode
                        name="left-add-shape"
                        ref={this._leftAddShapeRef}
                    />
                    <AddShapeNode
                        name="right-add-shape"
                        ref={this._rightAddShapeRef}
                    />
                    <AddShapeNode
                        name="top-add-shape"
                        ref={this._topAddShapeRef}
                    />
                    <AddShapeNode
                        name="bottom-add-shape"
                        ref={this._bottomAddShapeRef}
                    />
                </container>
                <container name="dummy" ref={this._dummyRef}>
                    {/* <rect
                        name="dummy-rect"
                        width={100}
                        height={100}
                        style={blockStyle}
                    /> */}
                </container>
            </container>
        );

        this._root = createNodeFromConfig(rootConfig);

        // 收集引用节点
        this._resizeHandlerNodes = controlPoints.map((p) => p.ref.value!);
        this._rotateHandlerNodes = rotatePoints.map((p) => p.ref.value!);
        this._lineContainers = [
            this._leftLineContainerRef.value!,
            this._rightLineContainerRef.value!,
            this._bottomLineContainerRef.value!,
            this._topLineContainerRef.value!,
        ];
        /**
         * 0 -> left
         * 1 -> right
         * 2 -> top
         * 3 -> bottom
         */
        this._addShapeNodes = [
            this._leftAddShapeRef.value!,
            this._rightAddShapeRef.value!,
            this._topAddShapeRef.value!,
            this._bottomAddShapeRef.value!,
        ];
        // this._lineNodes = [
        //     this._leftLineRef.value!,
        //     this._rightLineRef.value!,
        //     this._topLineRef.value!,
        //     this._bottomLineRef.value!,
        // ];
    }

    protected _onResize = (): void => {
        const { scale } = decomposeMatrix(
            this._lbNodeRef.value!.getWorldMatrix()
        );
        const handlerWidth = RESIZE_GIZMO_SIZE / scale.x;
        const handlerHeight = RESIZE_GIZMO_SIZE / scale.y;
        const lineWidth = GIZMO_LINE_WIDTH / scale.x;
        const lineHoverWidth = GIZMO_LINE_HOVER_WIDTH / scale.x;

        this._resizeHandlerNodes.forEach((node) => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = lineWidth;
        this._rightLineRef.value!.width = lineWidth;
        this._topLineRef.value!.height = lineWidth;
        this._bottomLineRef.value!.height = lineWidth;

        this._leftLineContainerRef.value!.width = lineHoverWidth;
        this._rightLineContainerRef.value!.width = lineHoverWidth;
        this._topLineContainerRef.value!.height = lineHoverWidth;
        this._bottomLineContainerRef.value!.height = lineHoverWidth;
    };

    public show(): void {
        if (!this._root) {
            return;
        }
        this._root.active = true;
    }

    public hide(): void {
        if (!this._root) {
            return;
        }
        this._root.active = false;
    }

    public hideResizer(): void {
        this.resizeHandlerNodes.forEach((node) => {
            node.active = false;
        });
        this._addShapeNodes.forEach((node) => {
            node.active = false;
        });
        this._rotateHandlerNodes.forEach((node) => {
            node.active = true;
        });
    }

    public showResizer(): void {
        this.resizeHandlerNodes.forEach((node) => {
            node.active = true;
        });
        this._addShapeNodes.forEach((node) => {
            node.active = true;
        });
        this._rotateHandlerNodes.forEach((node) => {
            node.active = true;
        });
    }

    public alignToNode(node: SNode): void {
        if (!this._root) {
            return;
        }
        this._root.alignTo(node, true);
    }

    public updateHandlerNodes(): void {
        if (!this._root) {
            return;
        }
        const [l, b, r, t] = this._root.getLocalRect();
        const { x: scaleX } = this._lbNodeRef.value!.getGlobalScale()!;
        const offset = 8 / scaleX;
        const lineOffset = 2 / scaleX;
        const addShapeOffset = SHAPE_GIZMO_OFFSET / scaleX;

        const handlerWidth = RESIZE_GIZMO_SIZE / scaleX;
        const handlerHeight = RESIZE_GIZMO_SIZE / scaleX;
        const rotateHandlerSize = ROTATE_GIZMO_SIZE / scaleX;
        const addShapeSize = ADD_SHAPE_GIZMO_SIZE / scaleX;

        const midX = l + (r - l) / 2;
        const midY = b + (t - b) / 2;
        // console.log(l, b, r, t);

        this._lbNodeRef.value!.position.set(l, b);
        this._rotateRefs[0].value!.position.set(l - offset, b - offset);

        this._ltNodeRef.value!.position.set(l, t);
        this._rotateRefs[1].value!.position.set(l - offset, t + offset);

        this._rbNodeRef.value!.position.set(r, b);
        this._rotateRefs[2].value!.position.set(r + offset, b - offset);

        this._rtNodeRef.value!.position.set(r, t);
        this._rotateRefs[3].value!.position.set(r + offset, t + offset);

        const lineWidth = GIZMO_LINE_WIDTH / scaleX;
        const lineHoverWidth = GIZMO_LINE_HOVER_WIDTH / scaleX;
        this._resizeHandlerNodes.forEach((node) => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = lineWidth;
        this._leftLineRef.value!.height = t - b + 2 * lineOffset;
        this._leftLineContainerRef.value!.width = lineHoverWidth;
        this._leftLineContainerRef.value!.height = t - b;
        this._leftLineContainerRef.value!.position.set(
            l - lineOffset,
            b - lineOffset
        );

        this.leftAddShapeNode.position.set(
            l - lineOffset - addShapeOffset,
            midY
        );
        this.leftAddShapeNode.width = addShapeSize;
        this.leftAddShapeNode.height = addShapeSize;

        this._bottomLineRef.value!.height = lineWidth;
        this._bottomLineRef.value!.width = r - l + 2 * lineOffset;
        this._bottomLineContainerRef.value!.height = lineHoverWidth;
        this._bottomLineContainerRef.value!.width = r - l;
        this._bottomLineContainerRef.value!.position.set(
            l - lineOffset,
            b - lineOffset
        );
        this.bottomAddShapeNode.position.set(
            midX,
            b - lineOffset - addShapeOffset
        );
        this.bottomAddShapeNode.width = addShapeSize;
        this.bottomAddShapeNode.height = addShapeSize;

        this._rightLineRef.value!.width = lineWidth;
        this._rightLineRef.value!.height = t - b + 2 * lineOffset;
        this._rightLineContainerRef.value!.width = lineHoverWidth;
        this._rightLineContainerRef.value!.height = t - b;
        this._rightLineContainerRef.value!.position.set(
            r + lineOffset,
            t + lineOffset
        );
        this.rightAddShapeNode.position.set(
            r + lineOffset + addShapeOffset,
            midY
        );
        this.rightAddShapeNode.width = addShapeSize;
        this.rightAddShapeNode.height = addShapeSize;

        this._topLineRef.value!.height = lineWidth;
        this._topLineRef.value!.width = r - l + 2 * lineOffset;
        this._topLineContainerRef.value!.height = lineHoverWidth;
        this._topLineContainerRef.value!.width = r - l;
        this._topLineContainerRef.value!.position.set(
            r + lineOffset,
            t + lineOffset
        );
        this.topAddShapeNode.position.set(
            midX,
            t + lineOffset + addShapeOffset
        );
        this.topAddShapeNode.width = addShapeSize;
        this.topAddShapeNode.height = addShapeSize;

        this._rotateRefs.forEach((ref) => {
            ref.value!.width = rotateHandlerSize;
            ref.value!.height = rotateHandlerSize;
        });
    }

    public onAddShapeNodeHover(node: SNode, isHover: boolean): void {
        const color = isHover ? SHAPE_GIZMO_HOVER_COLOR : SHAPE_GIZMO_COLOR;

        // 计算尺寸 - hover时增加20%
        const { x: scaleX } = this._lbNodeRef.value!.getGlobalScale()!;
        const baseSize = ADD_SHAPE_GIZMO_SIZE / scaleX;
        const hoverSize = baseSize * 1.2; // hover时增大20%
        const currentSize = isHover ? hoverSize : baseSize;

        // 修改节点的填充颜色
        const renderComps = node.getRenderComps();
        if (renderComps.length > 0) {
            const renderComp = renderComps[0];
            if (renderComp && 'applyStyle' in renderComp) {
                (renderComp as any).applyStyle({
                    style: {
                        fill: color,
                    },
                });
            }
        }

        // 修改节点尺寸
        node.width = currentSize;
        node.height = currentSize;

        const index = this._addShapeNodes.indexOf(node);
        const direction = this._getAddShapeNodeDirection(index);
        this._emit(
            isHover
                ? EventNames.ADD_SHAPE_HOVERED
                : EventNames.ADD_SHAPE_UNHOVERED,
            node,
            direction
        );
    }
}
