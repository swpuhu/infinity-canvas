import eventBus from '@/common/eventBus';
import { WhiteboardScene } from '../WhiteboardScene';
import { ReadonlyVec2 } from 'gl-matrix';
import { IPointData } from '@/common/types';
import { useZoomStore } from '@/store/ZoomStore';

export class ZoomController {
    private _scene: WhiteboardScene;

    private _zoomStore = useZoomStore();
    private _outerContainerStartPos: IPointData = {
        x: 0,
        y: 0,
    };

    constructor(scene: WhiteboardScene) {
        this._scene = scene;

        this._bindGlobalEvent();
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
        this._scene.screenToCanvasCoordinates(screenX, screenY);
        const currentZoomValue = this._zoomStore.zoomValue;
        const newZoomValue = currentZoomValue + deltaY * 0.001;
        this._zoomStore.setZoomValue(newZoomValue);
        console.log(
            'currentZoomValue',
            currentZoomValue,
            'newZoomValue',
            newZoomValue
        );
        eventBus.reDraw();
    };
}
