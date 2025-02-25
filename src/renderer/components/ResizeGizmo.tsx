import {
    EnumAspectKeepMode,
    EventNames,
    IPointData,
    ResizeGizmoMode,
    SNodeConfig,
    SNodeEvents,
    TransformOptions,
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
import { ReadonlyVec2, vec2 } from 'gl-matrix';
import { decomposeMatrix, isText, visitNodeRecursive } from '@/common/util';
import { CanvasEventSystem } from '../SEventManager';
import { SParagraph } from '../RenderComponents/SParagraph';
import eventBus from '@/common/eventBus';
import { createElement } from '../createElement';
import { WhiteboardScene } from '../WhiteboardScene';
import { ResizerUI } from './resizer/ResizerUI';
import { EventsHandler } from './resizer/EventsHandler';

const RESIZE_GIZMO_SIZE = 10;
const ROTATE_GIZMO_SIZE = 8;
const RESIZE_GIZMO_COLOR = 0x00bcfb;
const ROTATE_GIZMO_COLOR = 0x00ffbc;

const GIZMO_LINE_WIDTH = 1;
const GIZMO_LINE_COLOR = 0xcccccc;

export class ResizeGizmo {
    protected _scene: WhiteboardScene;
    protected _editor: CanvasEditor;
    protected _root: SNode | null = null;

    protected _rotateRef: SNodeConfig.IRefSNode = refSNode();

    protected _resizeStartPos: Vec2 = new Vec2(0, 0);

    protected _resizeStartRootNodePos: Vec2 = new Vec2(0, 0);

    protected _currentNode: SNode | null = null;

    protected _resizeStartNodeSize: Vec2 = new Vec2(0, 0);

    protected _dragStartPos: Vec2 = new Vec2(0, 0);

    protected resizeHandlerNodes: SNode[] = [];

    protected _isResizing = false;

    protected _isDragging = false;

    protected _currentHandleNode: SNode | null = null;

    protected _currentNodeOriginPos: Vec2 = new Vec2(0, 0);

    protected _originAspect: number = 1;

    private _originAnchor: IPointData = {
        x: 0,
        y: 0,
    };

    private _isLockAspect = false;
    private _originRotation: number = 0;

    private _uiComponent: ResizerUI;

    private _eventsHandler: EventsHandler;

    constructor(editor: CanvasEditor) {
        this._editor = editor;
        this._scene = editor.scene;

        this._uiComponent = new ResizerUI(this._scene);
        this._eventsHandler = new EventsHandler(editor, this._uiComponent);

        this._scene.topLayer.addChild(this._uiComponent.node!);
        this._bindEvents();
        this._scene.on(EventNames.RESIZE, this._onResize);
        this.addPointerEvent();
        this._initHideTextArea();

        this._enableDrag();
        this._enableResize();
    }

    protected addPointerEvent(): void {
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

    private _bindEvents(): void {
        this._editor.eventSystem.addSystemEventListener(
            SNodeEvents.KEY_DOWN,
            this._onKeyDown
        );

        this._editor.eventSystem.addSystemEventListener(
            SNodeEvents.KEY_UP,
            this._onKeyUp
        );
    }

    private _onKeyDown = (event: SNodeEvents.IKeyboardEvent): void => {
        if (event.shiftKey) {
            this._isLockAspect = true;
        }
    };

    private _onKeyUp = (event: SNodeEvents.IKeyboardEvent): void => {
        if (event.shiftKey) {
            this._isLockAspect = false;
        }
    };

    protected _onDragPointerDown = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._root || !this._currentNode) {
            return;
        }
        this._isDragging = true;
        if (
            this._currentMode === 'edit' &&
            this._currentText &&
            this._currentText.node === this._currentNode
        ) {
            this._enterEditMode(this._currentNode, event);
            const localPos = this._currentText!.node!.toLocal(
                event.getWorldPosition()
            );
            this._dragStartPos.set(localPos[0], localPos[1]);
            return;
        }
        this._exitEditMode();
        const localPos = this._currentNode.parent!.toLocal(
            event.getWorldPosition()
        );
        this._dragStartPos.set(localPos[0], localPos[1]);

        this._currentNodeOriginPos.set(
            this._currentNode.position.x,
            this._currentNode.position.y
        );
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
    protected _onDragPointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNode || !this._isDragging) {
            return;
        }

        const isEditMode = this._currentMode === 'edit';
        const host = isEditMode
            ? this._currentText!.node
            : this._currentNode.parent;
        const localPos = host!.toLocal(event.getWorldPosition());
        if (isEditMode) {
            const startIndex = this._currentText!.getCursorIndex(
                this._dragStartPos.x,
                this._dragStartPos.y
            );
            const endIndex = this._currentText!.getCursorIndex(
                localPos[0],
                localPos[1]
            );
            this.selectText(startIndex, endIndex);

            return;
        }
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
        // this._disableDrag();
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
        // this._enableResize();
    };

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
            console.log(diff);
            let nextWidth = this._resizeStartNodeSize.x + diff.x;
            let nextHeight = this._resizeStartNodeSize.y + diff.y;
            const keepWidthHeight = nextWidth / this._originAspect;
            const keepHeightWidth = nextHeight * this._originAspect;

            let aspectKeepMode = this._currentNode.aspectKeepMode;
            if (
                aspectKeepMode === EnumAspectKeepMode.NONE &&
                this._isLockAspect
            ) {
                if (nextWidth > keepHeightWidth) {
                    aspectKeepMode = EnumAspectKeepMode.WIDTH;
                } else {
                    aspectKeepMode = EnumAspectKeepMode.HEIGHT;
                }
            }

            if (aspectKeepMode === EnumAspectKeepMode.WIDTH) {
                nextHeight = keepWidthHeight;
            } else if (aspectKeepMode === EnumAspectKeepMode.HEIGHT) {
                nextWidth = keepHeightWidth;
            }
            this._root.width = nextWidth;
            this._root.height = nextHeight;
        }

        alignToNode(this._currentNode!, this._root);
        this.updateHandlerNodes();
    };

    private _onResizePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        if (!this._root || !this._currentNode || !this._isResizing) {
            return;
        }
        changeAnchorButStay(this._currentNode!, this._originAnchor);
        this._isResizing = false;
        // this._disableResize();
        this._currentHandleNode = null;
    };

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
    }

    public destroy(): void {}
}
