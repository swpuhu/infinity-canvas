import { nodePool } from '@/common/NodePool';
import { Pool } from '@/common/Pool';
import { SNodeEvents } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '@/renderer/Editor';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import SNode from '@/renderer/SNode';
import { cloneNodesAndMoveIn } from '@/renderer/util';
import EventEmitter from 'eventemitter3';
import { SnapGuide } from '../SnapGuide';
import { ResizerUI } from './ResizerUI';

export class DragEventsHandler extends EventEmitter {
    protected _currentNodes: SNode[] = [];

    protected _isDragging = false;

    protected _dragStartPos: Vec2 = new Vec2(0, 0);

    protected _originPos: Vec2 = new Vec2(0, 0);

    protected _pool: Pool<SNode> = nodePool;

    protected _dummyNodes: SNode[] = [];

    constructor(
        private _editor: CanvasEditor,
        private _resizerUI: ResizerUI,
        private _snapGuide: SnapGuide
    ) {
        super();
        this._enableDrag();
    }

    public setCurrentNodes(nodes: SNode[]): void {
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

    public dragStart = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();

        this._isDragging = true;
        const localPos = this._resizerUI.node.parent!.toLocal(
            event.getWorldPosition()
        );
        this._dragStartPos.set(localPos[0], localPos[1]);

        this._dummyNodes = cloneNodesAndMoveIn(
            this._currentNodes,
            this._resizerUI.dummyNode,
            this._pool
        );

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
        if (this._snapGuide && this._currentNodes.length === 1) {
            const newPos = this._snapGuide.calculateSnapLines(
                this._resizerUI.node,
                this._currentNodes
            );
            console.log('newPos', newPos);
            this._resizerUI.node.position.set(newPos.x, newPos.y);
        }

        this._dummyNodes.forEach((dummyNode, i) => {
            const pairNode = this._currentNodes[i];
            pairNode.alignTo(dummyNode);
        });
        // this._currentNodes!.alignTo(this._resizerUI.node!);
    };

    private _onDragPointerUp = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (this._isDragging) {
            this._isDragging = false;
            this._dummyNodes.forEach((dummyNode) => {
                this._pool.put(dummyNode);
            });
            return;
        }

        // this._disableDrag();
    };
}
