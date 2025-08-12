import { EventNames, SNodeConfig, SNodeEvents } from '@/common/types';
import { visitNodeRecursive } from '@/common/util';
import { CanvasEditor } from '@/renderer/Editor';
import SNode from '@/renderer/SNode';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';
import EventEmitter from 'eventemitter3';
import { SnapGuide } from '../SnapGuide';
import { DragEventsHandler } from './DragEventsHandler';
import { EditEventsHandler } from './EditEventsHandler';
import { ResizeEventsHandler } from './ResizeEventsHandler';
import { ResizerUI } from './ResizerUI';
import { RotateEventsHandler } from './RotateEventsHandler';
import { SelectEventsHandler } from './SelectEventsHandler';
import { SParagraph } from '@/renderer/RenderComponents/SParagraph';
import eventBus from '@/common/eventBus';
import { HoverEventsHandler } from './HoverEventsHandler';
import { SIArrow } from '@/renderer/RenderComponents/SIArrow';
export class EventsHandler extends EventEmitter {
    private _dragEventsHandler: DragEventsHandler;

    private _resizeEventsHandler: ResizeEventsHandler;

    private _rotateEventsHandler: RotateEventsHandler;

    private _editEventsHandler: EditEventsHandler;

    private _selectEventsHandler: SelectEventsHandler;

    private _hoverEventsHandler: HoverEventsHandler;

    private _prevHitNode: SNode | null = null;

    // Get the editor mode store
    private _editorModeStore = useEditorModeStore();

    constructor(
        private _editor: CanvasEditor,
        private _resizerUI: ResizerUI,
        _snapGuide: SnapGuide
    ) {
        super();
        this._dragEventsHandler = new DragEventsHandler(
            _editor,
            _resizerUI,
            _snapGuide
        );
        this._resizeEventsHandler = new ResizeEventsHandler(
            _editor,
            _resizerUI,
            _snapGuide
        );
        this._rotateEventsHandler = new RotateEventsHandler(
            _editor,
            _resizerUI,
            _snapGuide
        );
        this._editEventsHandler = new EditEventsHandler(_editor, _resizerUI);

        this._selectEventsHandler = new SelectEventsHandler(_editor);

        this._hoverEventsHandler = new HoverEventsHandler(_editor, _resizerUI);

        this._bindEvents();
    }

    private _bindEvents(): void {
        this._dragEventsHandler.on(
            EventNames.DRAG_SELECT_NODE,
            (nodes: SNode[]) => {
                this.setCurrentNodes(nodes);
            }
        );

        this._selectEventsHandler.on(
            EventNames.DRAG_SELECT_END,
            (nodes: SNode[]) => {
                this.setCurrentNodes(nodes);
                this.emit(EventNames.DRAG_SELECT_END, nodes);
            }
        );

        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_DOWN,
            this._handleCanvasLayerPointerDown
        );

        this._editor.eventSystem.addSystemEventListener(
            SNodeEvents.POINTER_MOVE,
            this._handleCanvasLayerPointerMove
        );

        this._dragEventsHandler.on(SNodeEvents.DRAGGING, () => {
            this._editEventsHandler.exitEditMode();
        });

        this._resizeEventsHandler.on(SNodeEvents.RESIZING, () => {
            this._editEventsHandler.exitEditMode();
        });

        this._rotateEventsHandler.on(SNodeEvents.ROTATING, () => {
            this._editEventsHandler.exitEditMode();
        });
    }

    public setCurrentNodes(nodes: SNode[]): void {
        this._resizeEventsHandler.setCurrentNode(nodes);
        this._rotateEventsHandler.setCurrentNodes(nodes);
        this._dragEventsHandler.setCurrentNodes(nodes);
        if (nodes.length === 1) {
            this._editEventsHandler.setCurrentNode(nodes[0]);
        }
    }

    private _handleCanvasLayerPointerMove = (
        event: SNodeEvents.IPointerEvent
    ) => {
        const currentMode = this._editorModeStore.currentMode;
        if (currentMode !== EditorMode.DEFAULT) {
            return;
        }

        const allNodes = this._collectAllNodes(
            (node) => node.type !== SNodeConfig.NodeType.IARROW
        );

        const hitNode: SNode | null = this._hitTest(event, allNodes);
        allNodes.forEach((node) => {
            node.preSelected = node === hitNode;
        });
        if (hitNode !== this._prevHitNode) {
            this._prevHitNode = hitNode;
            eventBus.reDraw();
        }
    };

    private _hitTest(
        event: SNodeEvents.IPointerEvent,
        allNodes?: SNode[]
    ): SNode | null {
        let hitNode: SNode | null = null;
        allNodes = allNodes || this._collectAllNodes();
        let hasHit = false;
        for (let i = 0; i < allNodes.length; i++) {
            const node = allNodes[i];
            const hit = node.hitTest(event.getWorldPosition());
            if (hit) {
                hasHit = true;
                hitNode = node;
                break;
            }
        }
        return hitNode;
    }

    private _handleCanvasLayerPointerDown = (
        event: SNodeEvents.IPointerEvent
    ) => {
        const hitNode: SNode | null = this._hitTest(event);
        this.emit(EventNames.POINTER_DOWN_NODE, hitNode);
        this._editEventsHandler.exitEditMode();
        if (hitNode) {
            this._dragEventsHandler.dragStart(event);
        } else {
            this._selectEventsHandler.selectStart(event);
        }
    };

    protected _collectAllNodes(filter?: (node: SNode) => boolean): SNode[] {
        const nodes: SNode[] = [];
        visitNodeRecursive(this._editor.scene.canvasLayer, (node) => {
            if (filter && !filter(node)) {
                return;
            }
            if (node.type === SNodeConfig.NodeType.ARROW) {
                return;
            }
            if (node !== this._editor.scene.canvasLayer) {
                const textComp = node.getComponent(SParagraph);
                if (textComp && textComp.hasBelongToNode()) {
                    // 如果 Text 节点有父节点，说明是位于图形节点中，不加入到可编辑节点列表中
                    return;
                }
                nodes.unshift(node);
            }
        });
        return nodes;
    }
}
