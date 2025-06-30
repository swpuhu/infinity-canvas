import { nodePool } from '@/common/NodePool';
import { Pool } from '@/common/Pool';
import {
    EnumAspectKeepMode,
    EventNames,
    IPointData,
    SNodeEvents,
} from '@/common/types';
import { isText } from '@/common/util';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '@/renderer/Editor';
import SNode from '@/renderer/SNode';
import { changeAnchorButStay, cloneNodesAndMoveIn } from '@/renderer/util';
import EventEmitter from 'eventemitter3';
import { SnapGuide } from '../SnapGuide';
import { ResizerUI } from './ResizerUI';
import { ReadonlyVec2 } from 'gl-matrix';

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
    private _currentNodes: SNode[] = [];
    private _isResizing: boolean = false;

    private _currentWidth: number = 0;
    private _currentHeight: number = 0;

    protected _pool: Pool<SNode> = nodePool;

    protected _dummyNodes: SNode[] = [];

    constructor(
        private _editor: CanvasEditor,
        private _resizerUI: ResizerUI,
        private _snapGuide: SnapGuide
    ) {
        super();
        this._enableResize();
        this._resizerUI.resizeHandlerNodes.forEach((node) => {
            this._editor.eventSystem.addEventListener(
                node,
                SNodeEvents.POINTER_DOWN,
                this._onResizePointerDown
            );
        });
    }
    public setCurrentNode(nodes: SNode[]): void {
        this._currentNodes = nodes;
    }

    private _onResizePointerDown = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNodes) {
            return;
        }

        this.emit(EventNames.RESIZE_START);

        // this._originAnchor = this._currentNodes.anchor.clone();
        this._isResizing = true;
        this._currentHandleNode = event.target;

        this._originAspect =
            this._resizerUI.node.width / this._resizerUI.node.height;

        const hostWorldPoints = this._resizerUI.node.getWorldPoints();
        let controllerPoint: ReadonlyVec2 = event.getWorldPosition();
        if (event.target === this._resizerUI.lbNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 1,
                y: 1,
            });
            this._resizerUI.dummyNode.anchor.set(1, 1);
            controllerPoint = hostWorldPoints[0];
        } else if (event.target === this._resizerUI.ltNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 1,
                y: 0,
            });
            this._resizerUI.dummyNode.anchor.set(1, 0);
            controllerPoint = hostWorldPoints[1];
        } else if (event.target === this._resizerUI.rbNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 0,
                y: 1,
            });
            this._resizerUI.dummyNode.anchor.set(0, 1);
            controllerPoint = hostWorldPoints[2];
        } else if (event.target === this._resizerUI.rtNode) {
            changeAnchorButStay(this._resizerUI.node, {
                x: 0,
                y: 0,
            });
            this._resizerUI.dummyNode.anchor.set(0, 0);
            controllerPoint = hostWorldPoints[3];
        }
        const hostNode = this._resizerUI.node;
        const localPos = hostNode!.toLocal(controllerPoint);
        this._resizeStartNodeSize.set(hostNode!.width, hostNode!.height);
        this._resizeStartPos.set(localPos[0], localPos[1]);

        this._currentWidth = this._resizerUI.node.width;
        this._currentHeight = this._resizerUI.node.height;
        console.log('this._currentWidth', this._currentWidth);
        console.log('this._currentHeight', this._currentHeight);

        this._dummyNodes = cloneNodesAndMoveIn(
            this._currentNodes,
            this._resizerUI.dummyNode,
            this._pool
        );
        this._currentNodes.forEach((item) => item.showFrame());
        this._resizerUI.updateHandlerNodes();
    };

    private _onResizePointerMove = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        if (!this._currentNodes || !this._isResizing) {
            return;
        }
        const hostNode = this._resizerUI.node;
        let fixedWorldPosition = event.getWorldPosition().slice();
        if (this._snapGuide) {
            fixedWorldPosition = this._snapGuide.fixEventWorldPosition(
                fixedWorldPosition,
                this._currentNodes
            );
        }
        const moveLocalPos = hostNode!.toLocal(
            fixedWorldPosition as ReadonlyVec2
        );
        this._resizerUI.hide();

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

        let aspectKeepMode = EnumAspectKeepMode.NONE;
        let isLockAspect = this._isLockAspect;
        if (this._currentNodes.length > 1) {
            isLockAspect = true;
        } else if (
            this._currentNodes.length === 1 &&
            isText(this._currentNodes[0])
        ) {
            isLockAspect = true;
            aspectKeepMode = EnumAspectKeepMode.HEIGHT;
        }
        if (aspectKeepMode === EnumAspectKeepMode.NONE && isLockAspect) {
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
        const scaleX = nextWidth / this._currentWidth;
        const scaleY = nextHeight / this._currentHeight;
        console.log('scaleX', scaleX);
        console.log('scaleY', scaleY);
        // const dummyNodeWorldMat = this._resizerUI.dummyNode.getWorldMatrix();
        // const { scale, position, rotation } =
        //     decomposeMatrix(dummyNodeWorldMat);
        // console.table({
        //     name: this._resizerUI.dummyNode.name,
        //     x: position.x,
        //     y: position.y,
        //     scaleX: scale.x,
        //     scaleY: scale.y,
        //     rotation,
        // });
        this._resizerUI.dummyNode.scale.set(scaleX, scaleY);

        this._dummyNodes.forEach((dummyNode, i) => {
            const pairNode = this._currentNodes[i];
            pairNode.alignTo(dummyNode);
            pairNode.removeScale(dummyNode.width, dummyNode.height);
        });
        // this._currentNodes!.alignTo(this._resizerUI.node!);
        // this._resizerUI.updateHandlerNodes();
        this.emit(SNodeEvents.RESIZING);
    };

    private _onResizePointerUp = (event: SNodeEvents.IPointerEvent): void => {
        if (!this._currentNodes || !this._isResizing) {
            return;
        }
        this._resizerUI.show();
        this._resizerUI.updateHandlerNodes();

        if (this._isResizing) {
            this._isResizing = false;
            this._currentHandleNode = null;
            this._dummyNodes.forEach((dummyNode) => {
                this._pool.put(dummyNode);
            });
            this._resizerUI.dummyNode.scale.set(1, 1);
            return;
        }
        // changeAnchorButStay(this._currentNodes!, this._originAnchor);
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
        this._currentNodes.forEach((item) => item.showFrame());
    }
}
