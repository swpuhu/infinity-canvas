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
            const outerContainer = this._scene.canvasContainer;
            this._outerContainerStartPos = outerContainer.position.clone();
        });
        eventBus.onPanCanvas(this._onPanCanvas);
        eventBus.onZoomCanvas(this._onZoomCanvas);
        eventBus.onShowAllCanvasNode(this._onShowAllCanvasNode);
    }

    private syncTopLayerAndCanvasNode(): void {
        const topLayer = this._scene.topLayer;
        const canvasNode = this._scene.getCanvasNode();

        topLayer.alignTo(canvasNode);
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
        const nextX = this._outerContainerStartPos.x + deltaX;
        const nextY = this._outerContainerStartPos.y + deltaY;

        this._scene.canvasContainer.position.set(nextX, nextY);
        this.syncTopLayerAndCanvasNode();
    };

    private _onZoomCanvas = (
        screenX: number,
        screenY: number,
        deltaY: number,
        newScale?: number
    ) => {
        const root = this._scene.rootNode;
        const canvasNode = this._scene.getCanvasNode();
        const canvasContainer = this._scene.canvasContainer;
        const outerContainer = canvasContainer;

        // 计算鼠标在根节点坐标系中的位置（屏幕坐标转换为根节点局部坐标）
        const mouseInRootNode = root.toLocal([screenX, screenY]);

        // 计算鼠标在虚拟画布上的局部坐标（缩放前）
        const mouseInCanvasNode = canvasNode.toLocal([screenX, screenY]);

        const currentZoomValue = this._zoomStore.zoomValue;
        const newZoomValue = currentZoomValue + deltaY * 0.001;
        const newScaleValue = newScale ?? zoomToScale(newZoomValue);

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

        this.syncTopLayerAndCanvasNode();

        eventBus.reDraw();
    };

    private _onShowAllCanvasNode = () => {
        const canvasNode = this._scene.getCanvasNode();

        // 计算所有节点的世界边界框
        const worldAABB = canvasNode.getWorldAABB(true);

        console.log('worldAABB', worldAABB);
        eventBus.reDraw();
    };
}
