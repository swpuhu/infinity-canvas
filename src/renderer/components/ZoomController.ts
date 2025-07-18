import eventBus from '@/common/eventBus';
import { WhiteboardScene } from '../WhiteboardScene';
import { ReadonlyVec2 } from 'gl-matrix';
import { IPointData } from '@/common/types';
import { useZoomStore } from '@/store/ZoomStore';
import { nodePool } from '@/common/NodePool';
import { Pool } from '@/common/Pool';
import SNode from '@/renderer/SNode';
import { zoomToScale } from '@/common/util';

export class ZoomController {
    private _scene: WhiteboardScene;

    private _pool: Pool<SNode> = nodePool;

    private _dummyNode: SNode | null = null;

    private _zoomStore = useZoomStore();
    private _outerContainerStartPos: IPointData = {
        x: 0,
        y: 0,
    };

    constructor(scene: WhiteboardScene) {
        this._scene = scene;
        this._initDummyNode();
        this._bindGlobalEvent();
    }

    private _initDummyNode() {
        this._dummyNode = this._pool.get();
        const rootNode = this._scene.rootNode;
        rootNode.addChild(this._dummyNode);
    }

    private _bindGlobalEvent() {
        eventBus.onPanCanvasStart(() => {
            const outerContainer = this._scene.outerContainer;
            this._outerContainerStartPos = outerContainer.position.clone();
        });
        eventBus.onPanCanvas(this._onPanCanvas);
        eventBus.onZoomCanvas(this._onZoomCanvas);
    }

    private _onPanCanvas = (
        screenX: number,
        screenY: number,
        startScreenX: number,
        startScreenY: number
    ) => {
        const canvasPos = this._scene.screenToCanvasCoordinates(
            screenX,
            screenY
        );
        const startCanvasPos = this._scene.screenToCanvasCoordinates(
            startScreenX,
            startScreenY
        );

        const deltaX = canvasPos[0] - startCanvasPos[0];
        const deltaY = canvasPos[1] - startCanvasPos[1];
        this._scene.outerContainer.position.set(
            this._outerContainerStartPos.x + deltaX,
            this._outerContainerStartPos.y - deltaY
        );
    };

    private _onZoomCanvas = (
        screenX: number,
        screenY: number,
        deltaY: number
    ) => {
        const root = this._scene.rootNode;
        const canvasNode = this._scene.getCanvasNode();
        const canvasContainer = this._scene.canvasContainer;
        const posInCanvasNode = canvasNode.toLocal([screenX, screenY]);
        const beforePosInRootNode = root.toLocal([screenX, screenY]);

        const outerContainer = this._scene.outerContainer;

        const currentZoomValue = this._zoomStore.zoomValue;

        const newZoomValue = currentZoomValue + deltaY * 0.001;
        const newScaleValue = zoomToScale(newZoomValue);

        this._zoomStore.setZoomValue(newZoomValue);
        canvasContainer.scale.set(newScaleValue, newScaleValue);

        const afterWorldPos = canvasNode.toGlobal(posInCanvasNode);
        const afterPosInRootNode = root.toLocal(afterWorldPos);
        console.log('beforePosInRootNode', beforePosInRootNode);
        console.log('afterPosInRootNode', afterPosInRootNode);
        const diffX = afterPosInRootNode[0] - beforePosInRootNode[0];
        const diffY = afterPosInRootNode[1] - beforePosInRootNode[1];
        outerContainer.position.set(
            outerContainer.position.x + diffX,
            outerContainer.position.y + diffY
        );

        eventBus.reDraw();
    };
}
