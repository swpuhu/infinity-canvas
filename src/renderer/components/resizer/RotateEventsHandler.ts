import { nodePool } from '@/common/NodePool';
import { Pool } from '@/common/Pool';
import { SNodeEvents } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '@/renderer/Editor';
import SNode from '@/renderer/SNode';
import { changeAnchorButStay, cloneNodesAndMoveIn } from '@/renderer/util';
import EventEmitter from 'eventemitter3';
import { ResizerUI } from './ResizerUI';

export class RotateEventsHandler extends EventEmitter {
    private _isRotating = false;

    private _rotateStartPos: Vec2 = new Vec2(0, 0);

    private _rotateStartRootNodePos: Vec2 = new Vec2(0, 0);

    private _currentNodes: SNode[] = [];

    private _pool: Pool<SNode> = nodePool;

    protected _dummyNodes: SNode[] = [];

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._enableRotate();

        this._editor.eventSystem.addEventListener(
            this._resizerUI.rotateNode,
            SNodeEvents.POINTER_DOWN,
            this._onRotatePointerDown
        );
    }
    public setCurrentNodes(nodes: SNode[]): void {
        this._currentNodes = nodes;
    }

    private _enableRotate(): void {
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onRotatePointerMove
        );
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onRotatePointerUp
        );
    }

    private _onRotatePointerDown = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        this._isRotating = true;
        changeAnchorButStay(this._resizerUI.node, {
            x: 0.5,
            y: 0.5,
        });
        const worldPos = this._resizerUI.node.worldPosition;
        this._rotateStartRootNodePos.set(worldPos[0], worldPos[1]);

        // const hostNode = this._resizerUI.node.parent;
        const eventWorldPos = event.getWorldPosition();
        this._rotateStartPos.set(eventWorldPos[0], eventWorldPos[1]);
        this._dummyNodes = cloneNodesAndMoveIn(
            this._currentNodes,
            this._resizerUI.node,
            this._pool
        );

        this._resizerUI.updateHandlerNodes();
    };

    private _onRotatePointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._isRotating) {
            return;
        }

        const moveWorldPos = event.getWorldPosition();
        const startVec = this._rotateStartPos.sub(this._rotateStartRootNodePos);
        const dragVec = new Vec2(moveWorldPos[0], moveWorldPos[1]).sub(
            this._rotateStartRootNodePos
        );
        const diffRad = dragVec.signRad(startVec);
        const angle = (diffRad * 180) / Math.PI;
        this._resizerUI.node.rotation = angle;

        this._dummyNodes.forEach((dummyNode, i) => {
            const pairNode = this._currentNodes[i];
            pairNode.alignTo(dummyNode);
        });
        // this._currentNodes!.alignTo(this._resizerUI.node!);
        // this._resizerUI.updateHandlerNodes();
    };

    private _onRotatePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (this._isRotating) {
            this._isRotating = false;
            this._dummyNodes.forEach((dummyNode) => {
                this._pool.put(dummyNode);
            });
        }
    };
}
