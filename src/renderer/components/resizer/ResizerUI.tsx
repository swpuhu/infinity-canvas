import { createNodeFromConfig } from '@/renderer/util';

import { CursorStyle, EventNames, IPointData, ResizeDirection, SNodeConfig, SNodeEvents } from '@/common/types';
import { decomposeMatrix } from '@/common/util';
import { createElement } from '@/renderer/createElement';
import SNode from '@/renderer/SNode';
import { refSNode } from '@/renderer/util';
import { WhiteboardScene } from '@/renderer/WhiteboardScene';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';

const RESIZE_GIZMO_SIZE = 10;
const ROTATE_GIZMO_SIZE = 8;
const RESIZE_GIZMO_COLOR = 0x00bcfb;
const ROTATE_GIZMO_COLOR = 0x00ffbc;

const GIZMO_LINE_WIDTH = 1;
const GIZMO_LINE_COLOR = 0xcccccc;

// 通用样式配置
const blockStyle = { fill: RESIZE_GIZMO_COLOR };
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
    anchor: IPointData;
}) => {
    return (
        <rect
            name={props.name}
            ref={props.ref}
            style={lineStyle}
            transform={{ anchor: props.anchor }}
        ></rect>
    );
};
export class ResizerUI {
    private _root: SNode | null = null;

    private _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rtNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _dummyRef: SNodeConfig.IRefSNode = refSNode();

    private _leftLineRef: SNodeConfig.IRefSNode = refSNode();
    private _rightLineRef: SNodeConfig.IRefSNode = refSNode();
    private _topLineRef: SNodeConfig.IRefSNode = refSNode();
    private _bottomLineRef: SNodeConfig.IRefSNode = refSNode();

    private _resizeHandlerNodes: SNode[] = [];
    private _rotateHandlerNodes: SNode[] = [];

    private _rotateRefs: SNodeConfig.IRefSNode[] = [refSNode(), refSNode(), refSNode(), refSNode()];

    private _editorModeStore = useEditorModeStore();

    private _prevHoveredNode: SNode | null = null;

    get resizeHandlerNodes(): SNode[] {
        return this._resizeHandlerNodes;
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
        if (currentMode !== EditorMode.DEFAULT && currentMode !== EditorMode.ROTATE && currentMode !== EditorMode.RESIZE) {
            return;
        }
        if (!currentTarget) {
            return;
        }
        const rotateNodeIndex = this.rotateNodes.indexOf(currentTarget);
        const resizerNodeIndex = this.resizeHandlerNodes.indexOf(currentTarget);

        if (rotateNodeIndex !== -1) {
            const direction = this._getDirection(rotateNodeIndex);
            console.log('currentTarget', currentTarget.name, direction);
            // this._editorModeStore.setMode(EditorMode.ROTATE, direction);
        } else if (resizerNodeIndex !== -1) {
            const direction = this._getDirection(resizerNodeIndex);
            console.log('currentTarget', currentTarget.name, direction);
            this._editorModeStore.setMode(EditorMode.RESIZE, direction);
        } else {
            this._editorModeStore.setMode(EditorMode.DEFAULT);
        }
        this._prevHoveredNode = currentTarget;
    };

    private _getDirection(nodeIndex: number): ResizeDirection {
        // index 0 -> lb
        // index 1 -> lt
        // index 2 -> rb
        // index 3 -> rt
        return nodeIndex === 0 ? 'nw' : nodeIndex === 1 ? 'sw' : nodeIndex === 2 ? 'ne' : 'se';
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
                        anchor={{ x: 0.5, y: 0 }}
                    />
                    <Line
                        name="right-line"
                        ref={this._rightLineRef}
                        anchor={{ x: 0.5, y: 1 }}
                    />
                    <Line
                        name="top-line"
                        ref={this._topLineRef}
                        anchor={{ x: 1, y: 0.5 }}
                    />
                    <Line
                        name="bottom-line"
                        ref={this._bottomLineRef}
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
                        <ellipse name={p.name} ref={p.ref} width={ROTATE_GIZMO_SIZE} height={ROTATE_GIZMO_SIZE} style={blockStyle}/>
                    ))}
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

        this._resizeHandlerNodes.forEach((node) => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = lineWidth;
        this._rightLineRef.value!.width = lineWidth;
        this._topLineRef.value!.height = lineWidth;
        this._bottomLineRef.value!.height = lineWidth;
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
        const offset = 2 / scaleX;
        // console.log(l, b, r, t);

        this._lbNodeRef.value!.position.set(l, b);
        this._rotateRefs[0].value!.position.set(l - offset, b - offset);

        this._ltNodeRef.value!.position.set(l, t);
        this._rotateRefs[1].value!.position.set(l - offset, t + offset);

        this._rbNodeRef.value!.position.set(r, b);
        this._rotateRefs[2].value!.position.set(r + offset, b - offset);

        this._rtNodeRef.value!.position.set(r, t);
        this._rotateRefs[3].value!.position.set(r + offset, t + offset);


        const handlerWidth = RESIZE_GIZMO_SIZE / scaleX;
        const handlerHeight = RESIZE_GIZMO_SIZE / scaleX;
        const rotateHandlerSize = ROTATE_GIZMO_SIZE / scaleX;

        const lineWidth = GIZMO_LINE_WIDTH / scaleX;
        this._resizeHandlerNodes.forEach((node) => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = lineWidth;
        this._leftLineRef.value!.height = t - b;
        this._leftLineRef.value!.position.set(l, b);

        this._bottomLineRef.value!.height = lineWidth;
        this._bottomLineRef.value!.width = r - l;
        this._bottomLineRef.value!.position.set(l, b);

        this._rightLineRef.value!.width = lineWidth;
        this._rightLineRef.value!.height = t - b;
        this._rightLineRef.value!.position.set(r, t);

        this._topLineRef.value!.height = lineWidth;
        this._topLineRef.value!.width = r - l;
        this._topLineRef.value!.position.set(r, t);

        this._rotateRefs.forEach((ref) => {
            ref.value!.width = rotateHandlerSize;
            ref.value!.height = rotateHandlerSize;
        });

    }
}
