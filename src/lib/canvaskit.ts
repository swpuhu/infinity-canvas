import { CanvasKit } from 'canvaskit-wasm';
import CanvasKitInit from 'canvaskit-wasm';

export class CanvasKitModule {
    static _canvasKitInstance: CanvasKit | null = null;
    static get CanvasKit() {
        if (!this._canvasKitInstance) {
            throw new Error('CanvasKitModule is not initialized');
        }
        return this._canvasKitInstance;
    }

    static async init() {
        this._canvasKitInstance = await CanvasKitInit({
            locateFile: file => {
                return '/node_modules/canvaskit-wasm/bin/' + file;
            },
        });
    }

    private constructor() {
        throw new Error(
            'do not allow construct by new operator, please use static method init to initialize'
        );
    }
}
