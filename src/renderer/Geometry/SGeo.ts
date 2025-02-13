import { Canvas, Paint } from 'canvaskit-wasm';
import { SRenderComponent } from '../SRenderComponent';
import { CanvasKitModule } from '@/lib/canvaskit';
import { FillOptions, ShadowOptions, StrokeOptions } from '@/common/types';
import { safeColor } from '@/common/util';

export class SGeo extends SRenderComponent {
    protected paint!: Paint;
    protected shadowPaint!: Paint;
    protected onCreated(): void {
        this.paint = new CanvasKitModule.CanvasKit.Paint();
    }

    private _getShadowPaint(): Paint {
        if (!this.shadowPaint) {
            this.shadowPaint = new CanvasKitModule.CanvasKit.Paint();
        }
        return this.shadowPaint;
    }

    public draw(_canvas: Canvas): void {
        if (this.shadowPaint) {
            this.drawShadow(_canvas, this.shadowPaint);
        }
        this.drawShape(_canvas, this.paint);
    }

    public drawShape(_canvas: Canvas, _paint: Paint): void {}

    public drawShadow(_canvas: Canvas, _paint: Paint): void {}

    public fill(options?: FillOptions): void {
        const paint = this.paint;
        if (options?.color) {
            const color = safeColor(options.color);
            paint.setColor(color);
        }
        if (options?.alpha) {
            paint.setAlphaf(options?.alpha);
        }
        paint.setStyle(CanvasKitModule.CanvasKit.PaintStyle.Fill);
    }

    public stroke(options?: StrokeOptions): void {
        const paint = this.paint;
        if (options?.color) {
            const color = safeColor(options.color);
            paint.setColor(color);
        }
        if (options?.alpha) {
            paint.setAlphaf(options?.alpha);
        }
    }

    public shadow(options: ShadowOptions): void {
        const shadowPaint = this._getShadowPaint();
        shadowPaint.setMaskFilter(
            CanvasKitModule.CanvasKit.MaskFilter.MakeBlur(
                CanvasKitModule.CanvasKit.BlurStyle.Normal,
                options.blur || 15,
                true
            )
        );
        shadowPaint.setColor(safeColor(options.color || 0x000000));
    }

    public destroy(): void {
        if (this.paint) {
            this.paint.delete();
        }
        if (this.shadowPaint) {
            this.shadowPaint.delete();
        }
    }
}
