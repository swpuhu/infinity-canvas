import {
    EnumAspectKeepMode,
    EventNames,
    IPointData,
    ResizeGizmoMode,
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
import { mat3, mat4, ReadonlyVec2, vec2 } from 'gl-matrix';
import {
    decomposeMatrix,
    isSprite,
    isText,
    visitNodeRecursive,
} from '@/common/util';
import { CanvasEventSystem, SPointerEvent } from '../SEventManager';
import { SParagraph } from '../RenderComponents/SParagraph';
import eventBus from '@/common/eventBus';

const RESIZE_GIZMO_SIZE = 10;
const ROTATE_GIZMO_SIZE = 8;
const RESIZE_GIZMO_COLOR = 0x00bcfb;
const ROTATE_GIZMO_COLOR = 0x00ffbc;

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

    private _dummyCursorNode = new SNode();

    protected _rotateRef: SNodeConfig.IRefSNode = refSNode();

    protected _resizeStartPos: Vec2 = new Vec2(0, 0);

    protected _resizeStartRootNodePos: Vec2 = new Vec2(0, 0);

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

    private _originAnchor: IPointData = {
        x: 0,
        y: 0,
    };

    private _originRotation: number = 0;

    private _hideTextArea: HTMLTextAreaElement | null = null;

    private _currentText: SParagraph | null = null;

    private _cursorDiv: HTMLElement | null = null;

    private _currentMode: ResizeGizmoMode = ResizeGizmoMode.NONE;

    constructor(editor: CanvasEditor) {
        this._editor = editor;
        this._scene = editor.scene;
        this._createHandler();
        this._scene.topLayer.addChild(this._root!);
        this._bindEvents();
        this._scene.on(EventNames.RESIZE, this._onResize);
        this.addPointerEvent();
        this._initHideTextArea();
    }
    private _initHideTextArea(): void {
        this._hideTextArea = document.createElement('textarea');
        this._hideTextArea.classList.add('text-area', 'hide');

        this._cursorDiv = document.createElement('div');
        this._cursorDiv.classList.add('cursor', 'hide');

        document.body.appendChild(this._hideTextArea);
        document.body.appendChild(this._cursorDiv);
        this._hideTextArea.addEventListener(
            'compositionupdate',
            this._onHideTextAreaInput
        );
        this._hideTextArea.addEventListener('input', this._onHideTextAreaInput);

        this._hideTextArea.addEventListener(
            'selectionchange',
            this._onHideTextAreaSelectionChange
        );
    }

    private _setCursorDivPositionByIndex(
        cursorIndex: number
    ): ReadonlyVec2 | null {
        if (!this._currentText) {
            return null;
        }
        const cursorInfo = this._currentText.getCursorInfoByIndex(cursorIndex);
        if (cursorInfo) {
            const worldPos = this._currentText.node!.toGlobal(cursorInfo.pos);
            this._cursorDiv!.classList.remove('hide');
            this._currentText.node?.addChild(this._dummyCursorNode);
            this._dummyCursorNode.setTransform({
                position: {
                    x: cursorInfo.pos[0],
                    y: cursorInfo.pos[1],
                },
            });
            const textWorldMatrix = this._dummyCursorNode.getWorldMatrix();
            this._dummyCursorNode.removeFromParent();
            const a = textWorldMatrix[0];
            const b = textWorldMatrix[1];
            const c = textWorldMatrix[3];
            const d = textWorldMatrix[4];
            const e = textWorldMatrix[6];
            const f = textWorldMatrix[7];
            this._cursorDiv!.style.transform = `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
            const globalScale = this._currentText.node!.getGlobalScale();
            this._cursorDiv!.style.height =
                cursorInfo.size * globalScale.y + 'px';
            return worldPos;
        }
        return null;
    }

    private _onHideTextAreaSelectionChange = (event: Event): void => {
        if (this._currentText) {
            const startIndex = this._hideTextArea!.selectionStart;
            const endIndex = this._hideTextArea!.selectionEnd;
            if (startIndex === endIndex) {
                this._setCursorDivPositionByIndex(startIndex);
            }
            console.log('selection change', startIndex, endIndex);
        }
    };

    private selectText(startIndex: number, endIndex: number): void {}

    private _onHideTextAreaInput = (event: Event): void => {
        const e = event as InputEvent | CompositionEvent;
        if (this._currentText) {
            this._currentText.text = this._hideTextArea!.value;
            alignToNode(this._root!, this._currentText.node!);
            this.updateHandlerNodes();
            eventBus.reDraw();
        }
    };

    protected addPointerEvent(): void {
        this._editor.eventSystem.addEventListener(
            this._scene.canvasLayer,
            SNodeEvents.POINTER_DOWN,
            (event: SNodeEvents.IPointerEvent) => {
                if (this._currentMode === 'edit' && this._currentText) {
                    const localPos = event.getLocalPosition(
                        this._currentText.node!
                    );
                    const cursorIndex = this._currentText.getCursorIndex(
                        localPos[0],
                        localPos[1]
                    );
                    const worldPos =
                        this._setCursorDivPositionByIndex(cursorIndex);
                    if (worldPos) {
                        this._focusTextArea(
                            this._currentText,
                            worldPos,
                            cursorIndex,
                            cursorIndex
                        );
                    }
                }
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

    private _focusTextArea(
        textComp: SParagraph,
        worldPos: ReadonlyVec2,
        startIndex: number,
        endIndex: number
    ): void {
        this._hideTextArea!.classList.remove('hide');
        this._hideTextArea!.textContent = textComp.text;

        if (worldPos) {
            this._hideTextArea!.style.left = worldPos[0] + 50 + 'px';
            this._hideTextArea!.style.top = worldPos[1] + 'px';
        }
        setTimeout(() => {
            this._hideTextArea!.focus();
            this._hideTextArea!.setSelectionRange(startIndex, endIndex);
        }, 100);
    }

    private _enterEditMode(
        node: SNode,
        event: SNodeEvents.IPointerEvent
    ): void {
        const textComp = node.getComponent(SParagraph);
        this._currentMode = ResizeGizmoMode.EDIT;
        if (textComp) {
            const eventLocalPos = event.getLocalPosition(node);
            const cursorIndex = textComp.getCursorIndex(
                eventLocalPos[0],
                eventLocalPos[1]
            );
            this._currentText = textComp;
            const worldPos = this._setCursorDivPositionByIndex(cursorIndex);
            if (worldPos) {
                this._focusTextArea(
                    textComp,
                    worldPos,
                    cursorIndex,
                    cursorIndex
                );
            }
        }
    }

    private _exitEditMode(): void {
        if (this._currentMode !== ResizeGizmoMode.EDIT) {
            return;
        }
        this._currentMode = ResizeGizmoMode.NONE;
        this._hideTextArea!.classList.add('hide');
        this._cursorDiv!.classList.add('hide');
        this._currentText = null;
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
                    name: 'rotate-point',
                    type: SNodeConfig.NodeType.CIRCLE,
                    ref: this._rotateRef,
                    width: ROTATE_GIZMO_SIZE,
                    height: ROTATE_GIZMO_SIZE,
                    style: {
                        fill: ROTATE_GIZMO_COLOR,
                    },
                },
            ],
        });

        // 收集引用节点
        this.resizeHandlerNodes = controlPoints.map(p => p.ref.value!);
        this.resizeHandlerNodes.push(this._rotateRef.value!);
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
        if (
            this._currentMode === 'edit' &&
            event.currentTarget === this._currentText!.node
        ) {
            this._enterEditMode(this._currentNode, event);
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
        if (diff.mag() > 5) {
            this._exitEditMode();
        }
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
        this._exitEditMode();

        this._originAnchor = this._currentNode.anchor.clone();
        this._currentMode = ResizeGizmoMode.RESIZE;
        this._isResizing = true;
        this._currentHandleNode = event.target;

        this._originAspect = this._currentNode.width / this._currentNode.height;

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
        } else if (event.target === this._rotateRef.value) {
            this._currentMode = ResizeGizmoMode.ROTATE;
            this._originRotation = this._root.rotation;

            changeAnchorButStay(this._root, {
                x: 0.5,
                y: 0.5,
            });
        }
        this._resizeStartRootNodePos.set(
            this._root.position.x,
            this._root.position.y
        );
        const hostNode =
            this._currentMode === ResizeGizmoMode.ROTATE
                ? this._root.parent
                : this._root;
        const localPos = hostNode!.toLocal(event.getWorldPosition());
        this._resizeStartNodeSize.set(hostNode!.width, hostNode!.height);
        this._resizeStartPos.set(localPos[0], localPos[1]);

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
        if (!this._root || !this._currentNode || !this._isResizing) {
            return;
        }
        const hostNode =
            this._currentMode === ResizeGizmoMode.ROTATE
                ? this._root.parent
                : this._root;
        const moveLocalPos = hostNode!.toLocal(event.getWorldPosition());
        if (this._currentMode === ResizeGizmoMode.ROTATE) {
            const startVec = this._resizeStartPos.sub(
                this._resizeStartRootNodePos
            );
            const dragVec = new Vec2(moveLocalPos[0], moveLocalPos[1]).sub(
                this._resizeStartRootNodePos
            );
            const diffRad = dragVec.signRad(startVec);
            const angle = (diffRad * 180) / Math.PI;
            this._root.rotation = this._originRotation + angle;
        } else {
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
        }

        alignToNode(this._currentNode!, this._root);
        this.updateHandlerNodes();
    };

    private _onResizePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        const node = event.target;
        if (!node) {
            return;
        }
        changeAnchorButStay(this._currentNode!, this._originAnchor);
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

        const { x: scaleX } = this._lbNodeRef.value!.getGlobalScale()!;

        const handlerWidth = RESIZE_GIZMO_SIZE / scaleX;
        const handlerHeight = RESIZE_GIZMO_SIZE / scaleX;
        const rotateHandlerSize = ROTATE_GIZMO_SIZE / scaleX;

        const lineWidth = GIZMO_LINE_WIDTH / scaleX;
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

        this._rotateRef.value!.width = rotateHandlerSize;
        this._rotateRef.value!.height = rotateHandlerSize;

        const midX = (l + r) / 2;
        this._rotateRef.value!.position.set(midX, b - 20 / scaleX);
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
        this._exitEditMode();
        this.updateHandlerNodes();
    }
}
