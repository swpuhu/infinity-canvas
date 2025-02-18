import {
    EventNames,
    IPointData,
    SNodeConfig,
    SNodeEvents,
} from '@/common/types';
import SNode from '../SNode';
import {
    alignToNode,
    changeAnchorButStay,
    createNodeFromConfig,
    refSNode,
} from '../util';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '../Editor';
import { SScene } from '../SScene';
import { mat3, mat4 } from 'gl-matrix';
import { decomposeMatrix } from '@/common/util';

const RESIZE_GIZMO_SIZE = 10;
const RESIZE_GIZMO_COLOR = 0x00bcfb;

const GIZMO_LINE_WIDTH = 1;
const GIZMO_LINE_COLOR = 0xcccccc;

export class ResizeGizmo {
    private _scene: SScene;
    private _editor: CanvasEditor;
    private _root: SNode | null = null;

    private _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rtNodeRef: SNodeConfig.IRefSNode = refSNode();

    private _leftLineRef: SNodeConfig.IRefSNode = refSNode();
    private _rightLineRef: SNodeConfig.IRefSNode = refSNode();
    private _topLineRef: SNodeConfig.IRefSNode = refSNode();
    private _bottomLineRef: SNodeConfig.IRefSNode = refSNode();

    private _resizeStartPos: Vec2 = new Vec2(0, 0);

    private _currentNode: SNode | null = null;

    private _resizeStartNodeSize: Vec2 = new Vec2(0, 0);

    private resizeHandlerNodes: SNode[] = [];

    private _lineNodes: SNode[] = [];

    private _isResizing = false;

    private _currentHandleNode: SNode | null = null;

    constructor(editor: CanvasEditor) {
        this._editor = editor;
        this._scene = editor.scene;
        this._createHandler();
        this._scene.topLayer.addChild(this._root!);
        this._bindEvents();
        this._scene.on(EventNames.RESIZE, this._onResize);

        this._editor.eventSystem.addEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_DOWN,
            () => {
                this.unMount();
            }
        );
    }

    private _onResize = (): void => {
        const { scale } = decomposeMatrix(
            this._lbNodeRef.value!.getWorldMatrix()
        );
        const handlerWidth = RESIZE_GIZMO_SIZE / scale.x;
        const handlerHeight = RESIZE_GIZMO_SIZE / scale.y;
        const lineWidth = GIZMO_LINE_WIDTH / scale.x;

        this.resizeHandlerNodes.forEach(node => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = lineWidth;
        this._rightLineRef.value!.width = lineWidth;
        this._topLineRef.value!.height = lineWidth;
        this._bottomLineRef.value!.height = lineWidth;
    };

    private _createHandler(): void {
        const globalScale = this._scene.getVirtualCanvasScale();
        const handlerSize = {
            width: RESIZE_GIZMO_SIZE / globalScale.x,
            height: RESIZE_GIZMO_SIZE / globalScale.y,
        };

        // 通用样式配置
        const blockStyle = { fill: RESIZE_GIZMO_COLOR };
        const lineStyle = { fill: GIZMO_LINE_COLOR };
        const commonRectConfig = (
            name: string,
            ref: SNodeConfig.IRefSNode
        ) => ({
            name,
            type: SNodeConfig.NodeType.RECT,
            ref,
            ...handlerSize,
            style: blockStyle,
        });

        // 创建控制点
        const controlPoints = [
            { name: 'left-bottom', ref: this._lbNodeRef },
            { name: 'left-top', ref: this._ltNodeRef },
            { name: 'right-bottom', ref: this._rbNodeRef },
            { name: 'right-top', ref: this._rtNodeRef },
        ];

        // 创建连接线
        const createLine = (
            name: string,
            ref: SNodeConfig.IRefSNode,
            anchor: IPointData
        ) => ({
            name,
            type: SNodeConfig.NodeType.RECT,
            ref,
            style: lineStyle,
            transform: { anchor },
        });

        this._root = createNodeFromConfig({
            name: 'resize-gizmo',
            type: SNodeConfig.NodeType.CONTAINER,
            transform: {
                anchor: {
                    x: 0,
                    y: 0,
                },
            },
            active: false,
            children: [
                {
                    name: 'lines',
                    type: SNodeConfig.NodeType.CONTAINER,
                    children: [
                        createLine('left-line', this._leftLineRef, {
                            x: 0.5,
                            y: 0,
                        }),
                        createLine('right-line', this._rightLineRef, {
                            x: 0.5,
                            y: 1,
                        }),
                        createLine('top-line', this._topLineRef, {
                            x: 1,
                            y: 0.5,
                        }),
                        createLine('bottom-line', this._bottomLineRef, {
                            x: 0,
                            y: 0.5,
                        }),
                    ],
                },
                {
                    name: 'resize-points',
                    type: SNodeConfig.NodeType.CONTAINER,
                    children: controlPoints.map(p =>
                        commonRectConfig(p.name, p.ref)
                    ),
                },
            ],
        });

        // 收集引用节点
        this.resizeHandlerNodes = controlPoints.map(p => p.ref.value!);
        this._lineNodes = [
            this._leftLineRef.value!,
            this._rightLineRef.value!,
            this._topLineRef.value!,
            this._bottomLineRef.value!,
        ];
    }

    private _bindEvents(): void {
        this.resizeHandlerNodes.forEach(node => {
            this._editor.eventSystem.addEventListener(
                node,
                SNodeEvents.POINTER_DOWN,
                this._onResizePointerDown
            );
        });
    }

    private _onResizePointerDown = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        console.log(
            'onResizePointerDown',
            event.target?.name,
            event.currentTarget?.name
        );
        if (!this._root) {
            return;
        }

        if (event.target === this._lbNodeRef.value) {
            changeAnchorButStay(this._root, {
                x: 1,
                y: 1,
            });
        } else if (event.target === this._ltNodeRef.value) {
            changeAnchorButStay(this._root, {
                x: 0,
                y: 1,
            });
        }

        this._currentHandleNode = event.target;

        const localPos = this._root.toLocal(event.getWorldPosition());
        this._resizeStartNodeSize.set(this._root.width, this._root.height);
        this._resizeStartPos.set(localPos[0], localPos[1]);

        this._isResizing = true;
        this.updateHandlerNodes();

        this._editor.eventSystem.addEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onResizePointerMove
        );
        this._editor.eventSystem.addEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onResizePointerUp
        );
    };

    private _onResizePointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        console.log('onResizePointerMove', event.target?.name);
        if (!this._root || !this._currentNode || !this._isResizing) {
            return;
        }
        console.log('onResizePointerMove', event.target?.name);
        const moveLocalPos = this._root?.toLocal(event.getWorldPosition());
        console.log('startPos', this._resizeStartPos);
        console.log('moveLocalPos', this._root.position);
        const diff = new Vec2(
            moveLocalPos[0] - this._resizeStartPos.x,
            moveLocalPos[1] - this._resizeStartPos.y
        );
        if (this._currentHandleNode === this._lbNodeRef.value) {
            diff.x = -diff.x;
            diff.y = -diff.y;
        } else if (this._currentHandleNode === this._ltNodeRef.value) {
            diff.x = -diff.x;
            console.log('lt', diff);
        }

        this._root.width = this._resizeStartNodeSize.x + diff.x;
        this._root.height = this._resizeStartNodeSize.y + diff.y;

        alignToNode(this._currentNode!, this._root);
        this.updateHandlerNodes();
    };

    private _onResizePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        const node = event.target;
        if (!node) {
            return;
        }
        this._isResizing = false;

        this._editor.eventSystem.removeEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onResizePointerMove
        );
        this._editor.eventSystem.removeEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onResizePointerUp
        );
        this._currentHandleNode = null;
    };

    public updateHandlerNodes(): void {
        if (!this._root) {
            return;
        }
        const [l, b, r, t] = this._root.getLocalRect();
        // console.log(l, b, r, t);

        this._lbNodeRef.value!.position.set(l, b);
        this._ltNodeRef.value!.position.set(l, t);
        this._rbNodeRef.value!.position.set(r, b);
        this._rtNodeRef.value!.position.set(r, t);

        const { scale } = decomposeMatrix(
            this._lbNodeRef.value!.getWorldMatrix()
        );
        const handlerWidth = RESIZE_GIZMO_SIZE / scale.x;
        const handlerHeight = RESIZE_GIZMO_SIZE / scale.y;

        const lineWidth = GIZMO_LINE_WIDTH / scale.x;
        this.resizeHandlerNodes.forEach(node => {
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
    }

    public mountToNode(targetNode: SNode): void {
        if (!this._root) {
            return;
        }
        this._currentNode = targetNode;
        this._root.active = true;
        alignToNode(this._root, targetNode);
        this.updateHandlerNodes();
    }

    public unMount(): void {
        this._currentNode = null;
        this._root!.active = false;
        this.updateHandlerNodes();
    }
}
