import { Canvas, Image } from 'canvaskit-wasm';
import { SRenderComponent } from './SRenderComponent';
import { loadImage, loadImageArrayBuffer } from '@/common/util';
import { CanvasKitModule } from '@/lib/canvaskit';
import eventBus from '@/common/eventBus';
import { EnumRenderComponentType } from '@/common/types';

enum EnumResizeMode {
    RAW = 'raw',
    CUSTOM = 'custom',
}

export class SSprite extends SRenderComponent {
    public static ResizeMode: {
        RAW: EnumResizeMode.RAW;
        CUSTOM: EnumResizeMode.CUSTOM;
    } = {
        RAW: EnumResizeMode.RAW,
        CUSTOM: EnumResizeMode.CUSTOM,
    };
    private _img: Image | null = null;

    private _url: string = '';

    public get url(): string {
        return this._url;
    }

    public resizeMode: EnumResizeMode = SSprite.ResizeMode.RAW;
    protected onCreated(): void {
        this.node!.renderType = EnumRenderComponentType.SPRITE;
    }

    public async setImageByUrl(src: string): Promise<void> {
        if (this._img) {
            this._img.delete();
            this._img = null;
        }
        const imgBuffer = await loadImageArrayBuffer(src);
        this._url = src;
        this.setImage(imgBuffer);
        eventBus.reDraw();
    }

    public setImage(imgBuffer: Uint8Array): void {
        CanvasKitModule.CanvasKit.MakeImageFromCanvasImageSource;
        this._img = CanvasKitModule.CanvasKit.MakeImageFromEncoded(imgBuffer);
        if (!this._img) {
            throw new Error('Failed to load image');
        }
        if (this.resizeMode === SSprite.ResizeMode.RAW) {
            this.node!.width = this._img.width();
            this.node!.height = this._img.height();
            console.log(this.node!.width, this.node!.height);
        }
    }
    public draw(canvas: Canvas): void {
        if (this._img) {
            const node = this.node;
            if (!node) {
                return;
            }
            const spritePaint = CanvasKitModule.getSpritePaint();

            // {
            //     const tempPaint = new CanvasKitModule.CanvasKit.Paint();

            //     const dilate = CanvasKitModule.CanvasKit.ImageFilter.MakeDilate(
            //         5,
            //         5,
            //         null
            //     );

            //     const zeroColorMatrix =
            //         CanvasKitModule.CanvasKit.ColorMatrix.scaled(0, 0, 0, 1);
            //     CanvasKitModule.CanvasKit.ColorMatrix.postTranslate(
            //         zeroColorMatrix,
            //         1,
            //         0.5,
            //         0,
            //         0
            //     );
            //     const zeroColorFilter =
            //         CanvasKitModule.CanvasKit.ColorFilter.MakeMatrix(
            //             zeroColorMatrix
            //         );
            //     const zeroFilter =
            //         CanvasKitModule.CanvasKit.ImageFilter.MakeColorFilter(
            //             zeroColorFilter,
            //             dilate
            //         );

            //     tempPaint.setImageFilter(zeroFilter);
            //     canvas.drawImageRectOptions(
            //         this._img,
            //         [0, 0, this._img.width(), this._img.height()],
            //         [
            //             -node.width * node.anchor.x,
            //             -node.height * node.anchor.y,
            //             node.width * (1 - node.anchor.x),
            //             node.height * (1 - node.anchor.y),
            //         ],
            //         CanvasKitModule.CanvasKit.FilterMode.Linear,
            //         CanvasKitModule.CanvasKit.MipmapMode.Linear,
            //         tempPaint
            //     );
            // }

            canvas.drawImageRectOptions(
                this._img,
                [0, 0, this._img.width(), this._img.height()],
                [
                    -node.width * node.anchor.x,
                    -node.height * node.anchor.y,
                    node.width * (1 - node.anchor.x),
                    node.height * (1 - node.anchor.y),
                ],
                CanvasKitModule.CanvasKit.FilterMode.Linear,
                CanvasKitModule.CanvasKit.MipmapMode.Linear,
                spritePaint
            );
        }
    }

    public destroy(): void {
        if (this._img) {
            this._img.delete();
        }
    }
}
