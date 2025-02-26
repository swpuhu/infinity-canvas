import { EventNames, SNodeEvents } from '@/common/types';
import { CanvasEditor } from '@/renderer/Editor';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import { ResizerUI } from './ResizerUI';
import SNode from '@/renderer/SNode';
import { Vec2 } from '@/common/Vec2';
import { alignToNode } from '@/renderer/util';
import EventEmitter from 'eventemitter3';

export class DragEventsHandler extends EventEmitter {
    protected _currentNode: SNode | null = null;

    protected _isDragging = false;

    protected _dragStartPos: Vec2 = new Vec2(0, 0);

    protected _currentNodeOriginPos: Vec2 = new Vec2(0, 0);

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._enableDrag();
    }

    public setCurrentNode(node: SNode): void {
        this._currentNode = node;
    }

    protected _enableDrag(): void {
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
        const localPos = this._currentNode.parent!.toLocal(
            event.getWorldPosition()
        );
        this._dragStartPos.set(localPos[0], localPos[1]);

        this._currentNodeOriginPos.set(
            this._currentNode.position.x,
            this._currentNode.position.y
        );
    };

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

        alignToNode(this._resizerUI.node!, this._currentNode!);
    };

    private _onDragPointerUp = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        this._isDragging = false;
        // this._disableDrag();
    };
}
