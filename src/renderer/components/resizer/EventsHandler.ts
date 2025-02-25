import { EventNames, SNodeEvents } from '@/common/types';
import { isText, visitNodeRecursive } from '@/common/util';
import { CanvasEditor } from '@/renderer/Editor';
import SNode from '@/renderer/SNode';
import EventEmitter from 'eventemitter3';
import { ResizerUI } from './ResizerUI';
import { DragEventsHandler } from './DragEventsHandler';

export class EventsHandler extends EventEmitter {
    private _dragEventsHandler: DragEventsHandler;

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._dragEventsHandler = new DragEventsHandler(_editor, _resizerUI);
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
        if (hitNode) {
            this.emit(EventNames.POINTER_DOWN_NODE, hitNode);
            if (isText(hitNode)) {
            }
            // this.mountToNode(hitNode);
            event.setCurrentTarget(hitNode);
            // this._onDragPointerDown(event);
            this._dragEventsHandler.dragStart(event);
        } else {
            // this.unMount();
        }
        this.emit(EventNames.POINTER_DOWN_NODE, hitNode);
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
