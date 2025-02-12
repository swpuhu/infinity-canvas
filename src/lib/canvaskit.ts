import { CanvasKit, Paint } from 'canvaskit-wasm';
import CanvasKitInit from 'canvaskit-wasm';

export class CanvasKitModule {
    static _canvasKitInstance: CanvasKit | null = null;

    static _spritePaint: Paint | null = null;

    static get CanvasKit() {
        if (!this._canvasKitInstance) {
            throw new Error('CanvasKitModule is not initialized');
        }
        return this._canvasKitInstance;
    }

    static destroy() {
        if (this._spritePaint) {
            this._spritePaint.delete();
            this._spritePaint = null;
        }
    }

    static async init() {
        this._canvasKitInstance = await CanvasKitInit({
            locateFile: file => {
                return '/node_modules/canvaskit-wasm/bin/' + file;
            },
        });
    }

    static getSpritePaint(): Paint {
        if (!this._spritePaint) {
            this._spritePaint = new this.CanvasKit.Paint();
            this._spritePaint.setAntiAlias(true);
        }
        return this._spritePaint;
    }

    private constructor() {
        throw new Error(
            'do not allow construct by new operator, please use static method init to initialize'
        );
    }
}
