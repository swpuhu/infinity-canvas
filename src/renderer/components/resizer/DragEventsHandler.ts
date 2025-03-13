import { Pool } from '@/common/Pool';
import { EventNames, SNodeEvents } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '@/renderer/Editor';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import SNode from '@/renderer/SNode';
import EventEmitter from 'eventemitter3';
import { ResizerUI } from './ResizerUI';

export class DragEventsHandler extends EventEmitter {
    protected _currentNodes: SNode[] = [];

    protected _isDragging = false;

    protected _dragStartPos: Vec2 = new Vec2(0, 0);

    protected _originPos: Vec2 = new Vec2(0, 0);

    protected _pool: Pool<SNode> = new Pool(10, SNode);

    protected _dummyNodes: SNode[] = [];

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._enableDrag();
    }

    public setCurrentNode(nodes: SNode[]): void {
        this._currentNodes = nodes;
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

    private cloneNodesAndMoveIn(): void {
        this._dummyNodes = this._currentNodes.map((node) => {
            const dummyNode = this._pool.get();
            dummyNode.width = node.width;
            dummyNode.height = node.height;
            dummyNode.anchor.set(node.anchor.x, node.anchor.y);
            dummyNode.setParent(node);
            dummyNode.moveInto(this._resizerUI.node);
            return dummyNode;
        });
    }

    public dragStart = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        console.log('currentNodes', this._currentNodes);
        this.emit(EventNames.DRAG_SELECT_NODE, this._currentNodes);
        this._isDragging = true;
        const localPos = this._resizerUI.node.parent!.toLocal(
            event.getWorldPosition()
        );
        this._dragStartPos.set(localPos[0], localPos[1]);

        this.cloneNodesAndMoveIn();

        this._originPos.set(
            this._resizerUI.node.position.x,
            this._resizerUI.node.position.y
        );
    };

    protected _onDragPointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNodes || !this._isDragging) {
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
        this._dummyNodes.forEach((dummyNode, i) => {
            const pairNode = this._currentNodes[i];
            pairNode.alignTo(dummyNode);
        });
        // this._currentNodes!.alignTo(this._resizerUI.node!);
    };

    private _onDragPointerUp = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        this._isDragging = false;
        // this._disableDrag();
    };
}
