import { CanvasKit, FontMgr, Paint } from 'canvaskit-wasm';
import CanvasKitInit from 'canvaskit-wasm';

export class CanvasKitModule {
    static _canvasKitInstance: CanvasKit | null = null;

    static _spritePaint: Paint | null = null;

    static _fontMgr: FontMgr | null = null;

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

    static async loadFont() {
        const fontData = await fetch('FZYTK.TTF').then(response =>
            response.arrayBuffer()
        );
        const fontMgr = CanvasKitModule.CanvasKit.FontMgr.FromData(fontData);
        this._fontMgr = fontMgr;
    }

    static async init() {
        this._canvasKitInstance = await CanvasKitInit({
            locateFile: file => {
                return '/node_modules/canvaskit-wasm/bin/' + file;
            },
        });

        await this.loadFont();
        console.log(this._fontMgr?.getFamilyName(0));
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
