import { EventNames, SNodeEvents } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '@/renderer/Editor';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import SNode from '@/renderer/SNode';
import EventEmitter from 'eventemitter3';
import { ResizerUI } from './ResizerUI';

export class DragEventsHandler extends EventEmitter {
    protected _currentNode: SNode | null = null;

    protected _isDragging = false;

    protected _dragStartPos: Vec2 = new Vec2(0, 0);

    protected _originPos: Vec2 = new Vec2(0, 0);

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._enableDrag();
    }

    public setCurrentNode(node: SNode): void {
        this._currentNode = node;
    }

    protected _enableDrag(): void {
        CanvasEventSystem.instance.addEventListener(
            this._resizerUI.node,
            SNodeEvents.POINTER_DOWN,
            this.dragStart
        );

        CanvasEventSystem.instance.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onDragPointerMove
        );
        CanvasEventSystem.instance.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onDragPointerUp
        );
    }
    public dragStart = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        this._currentNode = event.currentTarget;
        if (!this._currentNode) {
            return;
        }
        this.emit(EventNames.DRAG_SELECT_NODE, this._currentNode);
        this._isDragging = true;
        const localPos = this._resizerUI.node.parent!.toLocal(
            event.getWorldPosition()
        );
        this._dragStartPos.set(localPos[0], localPos[1]);

        this._originPos.set(
            this._resizerUI.node.position.x,
            this._resizerUI.node.position.y
        );
    };

    protected _onDragPointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNode || !this._isDragging) {
            return;
        }
        const localPos = this._resizerUI.node.parent!.toLocal(
            event.getWorldPosition()
        );
        const diff = new Vec2(
            localPos[0] - this._dragStartPos.x,
            localPos[1] - this._dragStartPos.y
        );

        this._resizerUI.node.position.set(
            this._originPos.x + diff.x,
            this._originPos.y + diff.y
        );
        this._currentNode!.alignTo(this._resizerUI.node!);
    };

    private _onDragPointerUp = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        this._isDragging = false;
        // this._disableDrag();
    };
}
