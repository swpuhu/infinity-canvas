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
            this._outerContainerStartPos.y + deltaY
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
        const outerContainer = this._scene.outerContainer;

        // 计算鼠标在根节点坐标系中的位置（屏幕坐标转换为根节点局部坐标）
        const mouseInRootNode = root.toLocal([screenX, screenY]);

        // 计算鼠标在虚拟画布上的局部坐标（缩放前）
        const mouseInCanvasNode = canvasNode.toLocal([screenX, screenY]);

        const currentZoomValue = this._zoomStore.zoomValue;
        const newZoomValue = currentZoomValue + deltaY * 0.001;
        const newScaleValue = zoomToScale(newZoomValue);

        // 应用新的缩放值
        this._zoomStore.setZoomValue(newZoomValue);
        canvasContainer.scale.set(newScaleValue, newScaleValue);

        // 计算缩放后，虚拟画布上的那个点在世界坐标系中的新位置
        const mouseWorldPosAfterZoom = canvasNode.toGlobal(mouseInCanvasNode);

        // 计算缩放后，该点在根节点坐标系中的新位置
        const mouseInRootNodeAfterZoom = root.toLocal(mouseWorldPosAfterZoom);

        // 计算位置差异
        const diffX = mouseInRootNodeAfterZoom[0] - mouseInRootNode[0];
        const diffY = mouseInRootNodeAfterZoom[1] - mouseInRootNode[1];

        // 调整 outerContainer 的位置，使鼠标在屏幕上的位置保持不变
        outerContainer.position.set(
            outerContainer.position.x - diffX,
            outerContainer.position.y - diffY
        );

        eventBus.reDraw();
    };
}
