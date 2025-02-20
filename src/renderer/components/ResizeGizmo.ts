import {
    EnumAspectKeepMode,
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
import {
    decomposeMatrix,
    isSprite,
    isText,
    visitNodeRecursive,
} from '@/common/util';
import { CanvasEventSystem, SPointerEvent } from '../SEventManager';
import { SParagraph } from '../RenderComponents/SParagraph';

const RESIZE_GIZMO_SIZE = 10;
const RESIZE_GIZMO_COLOR = 0x00bcfb;

const GIZMO_LINE_WIDTH = 1;
const GIZMO_LINE_COLOR = 0xcccccc;

export class ResizeGizmo {
    protected _scene: SScene;
    protected _editor: CanvasEditor;
    protected _root: SNode | null = null;

    protected _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    protected _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    protected _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    protected _rtNodeRef: SNodeConfig.IRefSNode = refSNode();

    protected _leftLineRef: SNodeConfig.IRefSNode = refSNode();
    protected _rightLineRef: SNodeConfig.IRefSNode = refSNode();
    protected _topLineRef: SNodeConfig.IRefSNode = refSNode();
    protected _bottomLineRef: SNodeConfig.IRefSNode = refSNode();

    protected _cursorRef: SNodeConfig.IRefSNode = refSNode();

    protected _resizeStartPos: Vec2 = new Vec2(0, 0);

    protected _currentNode: SNode | null = null;

    protected _resizeStartNodeSize: Vec2 = new Vec2(0, 0);

    protected _dragStartPos: Vec2 = new Vec2(0, 0);

    protected resizeHandlerNodes: SNode[] = [];

    protected _lineNodes: SNode[] = [];

    protected _isResizing = false;

    protected _isDragging = false;

    protected _currentHandleNode: SNode | null = null;

    protected _currentNodeOriginPos: Vec2 = new Vec2(0, 0);

    protected _originAspect: number = 1;

    constructor(editor: CanvasEditor) {
        this._editor = editor;
        this._scene = editor.scene;
        this._createHandler();
        this._scene.topLayer.addChild(this._root!);
        this._bindEvents();
        this._scene.on(EventNames.RESIZE, this._onResize);
        this.addPointerEvent();
    }

    protected addPointerEvent(): void {
        this._editor.eventSystem.addEventListener(
            this._scene.canvasLayer,
            SNodeEvents.POINTER_DOWN,
            (event: SNodeEvents.IPointerEvent) => {
                const allNodes = this._collectAllNodes();
                let hasHit = false;
                for (let i = 0; i < allNodes.length; i++) {
                    const node = allNodes[i];
                    const hit = node.hitTest(event.getWorldPosition());
                    if (hit) {
                        this.mountToNode(node);
                        this._onDragPointerDown(event);
                        hasHit = true;
                        break;
                    }
                }
                if (!hasHit) {
                    this.unMount();
                }
            }
        );
        this._editor.eventSystem.addEventListener(
            this._scene.canvasLayer,
            SNodeEvents.DB_CLICK,
            (event: SNodeEvents.IPointerEvent) => {
                const textNodes = this._collectTextNodes();
                let hasHit = false;
                for (let i = 0; i < textNodes.length; i++) {
                    const node = textNodes[i];
                    const hit = node.hitTest(event.getWorldPosition());
                    if (hit) {
                        this._enterEditMode(node, event);
                        hasHit = true;
                        break;
                    }
                }
            }
        );
    }

    protected _collectAllNodes(): SNode[] {
        const nodes: SNode[] = [];
        visitNodeRecursive(this._scene.canvasLayer, node => {
            if (node !== this._scene.canvasLayer) {
                nodes.unshift(node);
            }
        });
        return nodes;
    }

    private _collectTextNodes(): SNode[] {
        const nodes: SNode[] = [];
        visitNodeRecursive(this._scene.canvasLayer, node => {
            if (node !== this._scene.canvasLayer && isText(node)) {
                nodes.unshift(node);
            }
        });
        return nodes;
    }

    private _enterEditMode(
        node: SNode,
        event: SNodeEvents.IPointerEvent
    ): void {
        const textComp = node.getComponent(SParagraph);
        if (textComp) {
            const eventLocalPos = node.toLocal(event.getWorldPosition());
            const cursorInfo = textComp.getCursorPosInTextLocal(
                eventLocalPos[0],
                eventLocalPos[1]
            );
            if (!cursorInfo) {
                return;
            }
            const { pos, size } = cursorInfo;
            const worldPos = node.toGlobal(pos);
            const cursorNode = this._cursorRef.value!;
            const cursorPos = cursorNode.parent!.toLocal(worldPos);
            cursorNode.position.set(cursorPos[0], cursorPos[1]);
            cursorNode.height = size;
        }
    }

    protected _onResize = (): void => {
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

    protected _createHandler(): void {
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
                {
                    name: 'cursor',
                    type: SNodeConfig.NodeType.RECT,
                    ref: this._cursorRef,
                    width: 2,
                    height: 50,
                    style: { fill: 0x00bcfb },
                    transform: {
                        anchor: {
                            x: 0.5,
                            y: 0,
                        },
                    },
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

    protected _onDragPointerDown = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._root || !this._currentNode) {
            return;
        }

        this._isDragging = true;
        const localPos = this._currentNode.parent!.toLocal(
            event.getWorldPosition()
        );
        this._dragStartPos.set(localPos[0], localPos[1]);

        this._currentNodeOriginPos.set(
            this._currentNode.position.x,
            this._currentNode.position.y
        );

        this._enableDrag();
    };

    protected _enableDrag(): void {
        CanvasEventSystem.instance.addEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onDragPointerMove
        );
        CanvasEventSystem.instance.addEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onDragPointerUp
        );
    }

    protected _disableDrag(): void {
        CanvasEventSystem.instance.removeEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onDragPointerMove
        );
        CanvasEventSystem.instance.removeEventListener(
            this._scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onDragPointerUp
        );
    }

    protected _onDragPointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNode || !this._isDragging) {
            return;
        }
        const localPos = this._currentNode.parent!.toLocal(
            event.getWorldPosition()
        );
        const diff = new Vec2(
            localPos[0] - this._dragStartPos.x,
            localPos[1] - this._dragStartPos.y
        );

        this._currentNode.position.set(
            this._currentNodeOriginPos.x + diff.x,
            this._currentNodeOriginPos.y + diff.y
        );
        // alignToNode(this._currentNode!, this._root!);
        alignToNode(this._root!, this._currentNode!);
    };

    private _onDragPointerUp = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._root || !this._isDragging) {
            return;
        }
        this._isDragging = false;
        this._disableDrag();
    };

    private _onResizePointerDown = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._root || !this._currentNode) {
            return;
        }

        if (event.target === this._lbNodeRef.value) {
            changeAnchorButStay(this._root, {
                x: 1,
                y: 1,
            });
        } else if (event.target === this._ltNodeRef.value) {
            changeAnchorButStay(this._root, {
                x: 1,
                y: 0,
            });
        } else if (event.target === this._rbNodeRef.value) {
            changeAnchorButStay(this._root, {
                x: 0,
                y: 1,
            });
        } else if (event.target === this._rtNodeRef.value) {
            changeAnchorButStay(this._root, {
                x: 0,
                y: 0,
            });
        }

        this._currentHandleNode = event.target;

        const localPos = this._root.toLocal(event.getWorldPosition());
        this._resizeStartNodeSize.set(this._root.width, this._root.height);
        this._resizeStartPos.set(localPos[0], localPos[1]);

        this._isResizing = true;
        this._originAspect = this._currentNode.width / this._currentNode.height;
        this.updateHandlerNodes();
        this._enableResize();
    };

    private _enableResize(): void {
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
    }

    private _disableResize(): void {
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
    }

    private _onResizePointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        // console.log('onResizePointerMove', event.target?.name);
        if (!this._root || !this._currentNode || !this._isResizing) {
            return;
        }
        const moveLocalPos = this._root?.toLocal(event.getWorldPosition());
        const diff = new Vec2(
            moveLocalPos[0] - this._resizeStartPos.x,
            moveLocalPos[1] - this._resizeStartPos.y
        );
        if (this._currentHandleNode === this._lbNodeRef.value) {
            diff.x = -diff.x;
            diff.y = -diff.y;
        } else if (this._currentHandleNode === this._ltNodeRef.value) {
            diff.x = -diff.x;
        } else if (this._currentHandleNode === this._rbNodeRef.value) {
            diff.y = -diff.y;
        }
        let nextWidth = this._resizeStartNodeSize.x + diff.x;
        let nextHeight = this._resizeStartNodeSize.y + diff.y;
        if (this._currentNode.aspectKeepMode === EnumAspectKeepMode.WIDTH) {
            nextHeight = nextWidth / this._originAspect;
        } else if (
            this._currentNode.aspectKeepMode === EnumAspectKeepMode.HEIGHT
        ) {
            nextWidth = nextHeight * this._originAspect;
        }
        this._root.width = nextWidth;
        this._root.height = nextHeight;

        alignToNode(this._currentNode!, this._root);
        this.updateHandlerNodes();
    };

    private _onResizePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        const node = event.target;
        if (!node) {
            return;
        }
        this._isResizing = false;
        this._disableResize();
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
