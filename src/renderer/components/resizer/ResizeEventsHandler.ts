import { CanvasEditor } from '@/renderer/Editor';
import { ResizerUI } from './ResizerUI';
import {
    EnumAspectKeepMode,
    EventNames,
    IPointData,
    SNodeEvents,
} from '@/common/types';
import EventEmitter from 'eventemitter3';
import SNode from '@/renderer/SNode';
import { Vec2 } from '@/common/Vec2';
import { alignToNode, changeAnchorButStay } from '@/renderer/util';

export class ResizeEventsHandler extends EventEmitter {
    private _currentHandleNode: SNode | null = null;

    private _originAspect: number = 1;

    private _resizeStartNodeSize: Vec2 = new Vec2(0, 0);

    private _resizeStartPos: Vec2 = new Vec2(0, 0);

    private _originAnchor: IPointData = {
        x: 0,
        y: 0,
    };

    private _isLockAspect = false;
    private _currentNode: SNode | null = null;
    private _isResizing: boolean = false;

    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        super();
        this._enableResize();
        this._resizerUI.resizeHandlerNodes.forEach(node => {
            this._editor.eventSystem.addEventListener(
                node,
                SNodeEvents.POINTER_DOWN,
                this._onResizePointerDown
            );
        });
    }
    public setCurrentNode(node: SNode): void {
        this._currentNode = node;
    }

    private _onResizePointerDown = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNode) {
            return;
        }

        this.emit(EventNames.RESIZE_START);

        this._originAnchor = this._currentNode.anchor.clone();
        this._isResizing = true;
        this._currentHandleNode = event.target;

        this._originAspect = this._currentNode.width / this._currentNode.height;

        if (event.target === this._resizerUI.lbNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 1,
                y: 1,
            });
        } else if (event.target === this._resizerUI.ltNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 1,
                y: 0,
            });
        } else if (event.target === this._resizerUI.rbNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 0,
                y: 1,
            });
        } else if (event.target === this._resizerUI.rtNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 0,
                y: 0,
            });
        }
        const hostNode = this._resizerUI.node;
        const localPos = hostNode!.toLocal(event.getWorldPosition());
        this._resizeStartNodeSize.set(hostNode!.width, hostNode!.height);
        this._resizeStartPos.set(localPos[0], localPos[1]);

        this._resizerUI.updateHandlerNodes();
    };

    private _onResizePointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNode || !this._isResizing) {
            return;
        }
        const hostNode = this._resizerUI.node;
        const moveLocalPos = hostNode!.toLocal(event.getWorldPosition());

        const diff = new Vec2(
            moveLocalPos[0] - this._resizeStartPos.x,
            moveLocalPos[1] - this._resizeStartPos.y
        );
        if (this._currentHandleNode === this._resizerUI.lbNode) {
            diff.x = -diff.x;
            diff.y = -diff.y;
        } else if (this._currentHandleNode === this._resizerUI.ltNode) {
            diff.x = -diff.x;
        } else if (this._currentHandleNode === this._resizerUI.rbNode) {
            diff.y = -diff.y;
        }
        let nextWidth = this._resizeStartNodeSize.x + diff.x;
        let nextHeight = this._resizeStartNodeSize.y + diff.y;
        const keepWidthHeight = nextWidth / this._originAspect;
        const keepHeightWidth = nextHeight * this._originAspect;

        let aspectKeepMode = this._currentNode.aspectKeepMode;
        if (aspectKeepMode === EnumAspectKeepMode.NONE && this._isLockAspect) {
            if (nextWidth > keepHeightWidth) {
                aspectKeepMode = EnumAspectKeepMode.WIDTH;
            } else {
                aspectKeepMode = EnumAspectKeepMode.HEIGHT;
            }
        }

        if (aspectKeepMode === EnumAspectKeepMode.WIDTH) {
            nextHeight = keepWidthHeight;
        } else if (aspectKeepMode === EnumAspectKeepMode.HEIGHT) {
            nextWidth = keepHeightWidth;
        }
        this._resizerUI.node!.width = nextWidth;
        this._resizerUI.node!.height = nextHeight;
        this._currentNode!.alignTo(this._resizerUI.node!);
        this._resizerUI.updateHandlerNodes();
    };

    private _onResizePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        if (!this._currentNode || !this._isResizing) {
            return;
        }
        changeAnchorButStay(this._currentNode!, this._originAnchor);
        this._isResizing = false;
        this._currentHandleNode = null;
    };

    private _enableResize(): void {
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onResizePointerMove
        );
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onResizePointerUp
        );
    }
}
