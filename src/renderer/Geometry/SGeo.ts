import { Canvas, Paint } from 'canvaskit-wasm';
import { SRenderComponent } from '../SRenderComponent';
import { CanvasKitModule } from '@/lib/canvaskit';
import { FillOptions, ShadowOptions, StrokeOptions } from '@/common/types';
import { safeColor } from '@/common/util';

export class SGeo extends SRenderComponent {
    protected fillPaint!: Paint;
    protected strokePaint!: Paint;
    protected shadowPaint!: Paint;
    protected onCreated(): void {}

    private _getShadowPaint(): Paint {
        if (!this.shadowPaint) {
            this.shadowPaint = new CanvasKitModule.CanvasKit.Paint();
        }
        return this.shadowPaint;
    }

    private _getFillPaint(): Paint {
        if (!this.fillPaint) {
            this.fillPaint = new CanvasKitModule.CanvasKit.Paint();
            this.fillPaint.setStyle(CanvasKitModule.CanvasKit.PaintStyle.Fill);
            this.fillPaint.setAntiAlias(true);
        }
        return this.fillPaint;
    }

    private _getStrokePaint(): Paint {
        if (!this.strokePaint) {
            this.strokePaint = new CanvasKitModule.CanvasKit.Paint();
            this.strokePaint.setStyle(
                CanvasKitModule.CanvasKit.PaintStyle.Stroke
            );
            this.strokePaint.setAntiAlias(true);
        }
        return this.strokePaint;
    }

    public draw(_canvas: Canvas): void {
        if (this.shadowPaint) {
            this.drawShadow(_canvas, this.shadowPaint);
        }
        if (this.fillPaint) {
            this.drawShape(_canvas, this.fillPaint);
        }
        if (this.strokePaint) {
            this.drawShape(_canvas, this.strokePaint);
        }
    }

    public drawShape(_canvas: Canvas, _paint: Paint): void {}

    public drawShadow(_canvas: Canvas, _paint: Paint): void {}

    public fill(options?: FillOptions): void {
        const paint = this._getFillPaint();
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
        const paint = this._getStrokePaint();
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
        if (this.fillPaint) {
            this.fillPaint.delete();
        }
        if (this.strokePaint) {
            this.strokePaint.delete();
        }
        if (this.shadowPaint) {
            this.shadowPaint.delete();
        }
    }
}
