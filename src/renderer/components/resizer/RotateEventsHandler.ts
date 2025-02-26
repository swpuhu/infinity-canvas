import { CanvasEditor } from '@/renderer/Editor';
import { ResizerUI } from './ResizerUI';
import EventEmitter from 'eventemitter3';
import { SNodeEvents } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import SNode from '@/renderer/SNode';

export class RotateEventsHandler extends EventEmitter {
    private _isRotating = false;

    private _rotateStartPos: Vec2 = new Vec2(0, 0);

    private _rotateStartRootNodePos: Vec2 = new Vec2(0, 0);

    private _currentNode: SNode | null = null;

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._enableRotate();

        this._editor.eventSystem.addEventListener(
            this._resizerUI.rotateNode,
            SNodeEvents.POINTER_DOWN,
            this._onRotatePointerDown
        );
    }
    public setCurrentNode(node: SNode): void {
        this._currentNode = node;
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
        this._rotateStartRootNodePos.set(
            this._resizerUI.node.position.x,
            this._resizerUI.node.position.y
        );
        const hostNode = this._resizerUI.node.parent;
        const localPos = hostNode!.toLocal(event.getWorldPosition());
        this._rotateStartPos.set(localPos[0], localPos[1]);
    };

    private _onRotatePointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._isRotating) {
            return;
        }
        const hostNode = this._resizerUI.node.parent;
        const moveLocalPos = hostNode!.toLocal(event.getWorldPosition());
        const startVec = this._rotateStartPos.sub(this._rotateStartRootNodePos);
        const dragVec = new Vec2(moveLocalPos[0], moveLocalPos[1]).sub(
            this._rotateStartRootNodePos
        );
        const diffRad = dragVec.signRad(startVec);
        const angle = (diffRad * 180) / Math.PI;
        this._resizerUI.node.rotation = angle;

        this._resizerUI.updateHandlerNodes();
    };

    private _onRotatePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        this._isRotating = false;
    };
}
