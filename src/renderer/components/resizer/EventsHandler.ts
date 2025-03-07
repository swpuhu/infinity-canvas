import { EventNames, SNodeEvents } from '@/common/types';
import { isText, visitNodeRecursive } from '@/common/util';
import { CanvasEditor } from '@/renderer/Editor';
import SNode from '@/renderer/SNode';
import EventEmitter from 'eventemitter3';
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

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._dragEventsHandler = new DragEventsHandler(_editor, _resizerUI);
        this._resizeEventsHandler = new ResizeEventsHandler(
            _editor,
            _resizerUI
        );
        this._rotateEventsHandler = new RotateEventsHandler(
            _editor,
            _resizerUI
        );
        this._editEventsHandler = new EditEventsHandler(_editor, _resizerUI);

        this._selectEventsHandler = new SelectEventsHandler(_editor);
        this._dragEventsHandler.on(EventNames.DRAG_SELECT_NODE, (node: SNode) => {
            this._resizeEventsHandler.setCurrentNode([node]);
            this._rotateEventsHandler.setCurrentNode([node]);
            this._editEventsHandler.setCurrentNode(node);
        });

        this._selectEventsHandler.on(EventNames.DRAG_SELECT_END, (nodes: SNode[]) => {
            this._resizeEventsHandler.setCurrentNode(nodes);
            this._rotateEventsHandler.setCurrentNode(nodes);
            this.emit(EventNames.DRAG_SELECT_END, nodes);
        });

        this._editor.eventSystem.addEventListener(
            this._editor.scene.canvasLayer,
            SNodeEvents.POINTER_DOWN,
            this._handleCanvasLayerPointerDown
        );

        this._editor.eventSystem.addEventListener(
            this._editor.scene.canvasLayer,
            SNodeEvents.DB_CLICK,
            this._handleCanvasLayerDBClick
        );
    }

    private _handleCanvasLayerDBClick = (event: SNodeEvents.IPointerEvent) => {
        const textNodes = this._collectTextNodes();
        let hasHit = false;
        let hitNode: SNode | null = null;
        for (let i = 0; i < textNodes.length; i++) {
            const node = textNodes[i];
            const hit = node.hitTest(event.getWorldPosition());
            if (hit) {
                // this._enterEditMode(node, event);
                hasHit = true;
                hitNode = node;
                break;
            }
        }
        this.emit(EventNames.DB_CLICK_NODE, hitNode);
        if (hitNode) {
            this._editEventsHandler.setCurrentNode(hitNode);
            this._editEventsHandler.enterEditMode(hitNode, event);
        }
    };

    private _handleCanvasLayerPointerDown = (
        event: SNodeEvents.IPointerEvent
    ) => {
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
            if (isText(hitNode)) {
            }
            event.setCurrentTarget(hitNode);
            this._dragEventsHandler.dragStart(event);
        } else {
            this._editEventsHandler.exitEditMode();
            this._selectEventsHandler.selectStart(event);
        }
    };

    protected _collectAllNodes(): SNode[] {
        const nodes: SNode[] = [];
        visitNodeRecursive(this._editor.scene.canvasLayer, node => {
            if (node !== this._editor.scene.canvasLayer) {
                nodes.unshift(node);
            }
        });
        return nodes;
    }
    private _collectTextNodes(): SNode[] {
        const nodes: SNode[] = [];
        visitNodeRecursive(this._editor.scene.canvasLayer, node => {
            if (node !== this._editor.scene.canvasLayer && isText(node)) {
                nodes.unshift(node);
            }
        });
        return nodes;
    }
}
