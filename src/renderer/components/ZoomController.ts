import { WhiteboardScene } from '../WhiteboardScene';

export class ZoomController {
    private _scene: WhiteboardScene;
    private _zoom: number;

    constructor(scene: WhiteboardScene) {
        this._scene = scene;
        this._zoom = 1;
    }
}
