import { EventNames, SNodeEvents } from '@/common/types';
import { visitNodeRecursive } from '@/common/util';
import { CanvasEditor } from '@/renderer/Editor';
import SNode from '@/renderer/SNode';
import { useEditorModeStore } from '@/store/EditorModeStore';
import EventEmitter from 'eventemitter3';
import { SnapGuide } from '../SnapGuide';
import { DragEventsHandler } from './DragEventsHandler';
import { EditEventsHandler } from './EditEventsHandler';
import { ResizeEventsHandler } from './ResizeEventsHandler';
import { ResizerUI } from './ResizerUI';
import { RotateEventsHandler } from './RotateEventsHandler';
import { SelectEventsHandler } from './SelectEventsHandler';
export class EventsHandler extends EventEmitter {
    private _dragEventsHandler: DragEventsHandler;

    private _resizeEventsHandler: ResizeEventsHandler;

    private _rotateEventsHandler: RotateEventsHandler;

    private _editEventsHandler: EditEventsHandler;

    private _selectEventsHandler: SelectEventsHandler;

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

    private setCurrentNodes(nodes: SNode[]): void {
        this._resizeEventsHandler.setCurrentNode(nodes);
        this._rotateEventsHandler.setCurrentNodes(nodes);
        this._dragEventsHandler.setCurrentNodes(nodes);
        if (nodes.length === 1) {
            this._editEventsHandler.setCurrentNode(nodes[0]);
        }
    }

    private _handleCanvasLayerPointerDown = (
        event: SNodeEvents.IPointerEvent
    ) => {
        // Skip if in hand tool mode
        if (this._editorModeStore.isHandToolMode) return;

        let hitNode: SNode | null = null;
        const allNodes = this._collectAllNodes();
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
        this.emit(EventNames.POINTER_DOWN_NODE, hitNode);
        if (hitNode) {
            this.setCurrentNodes([hitNode]);

            this._dragEventsHandler.dragStart(event);
        } else {
            this._editEventsHandler.exitEditMode();
            this._selectEventsHandler.selectStart(event);
        }
    };

    protected _collectAllNodes(): SNode[] {
        const nodes: SNode[] = [];
        visitNodeRecursive(this._editor.scene.canvasLayer, (node) => {
            if (node !== this._editor.scene.canvasLayer) {
                nodes.unshift(node);
            }
        });
        return nodes;
    }
}
