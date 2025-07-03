import eventBus from '@/common/eventBus';
import { WhiteboardScene } from '../WhiteboardScene';
import { ReadonlyVec2 } from 'gl-matrix';
import { IPointData } from '@/common/types';

export class ZoomController {
    private _scene: WhiteboardScene;

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
        eventBus.onPanCanvas(
            (
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
            }
        );
    }
}
