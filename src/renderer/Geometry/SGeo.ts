import {
    FillOptions,
    ShadowOptions,
    SNodeConfig,
    StrokeOptions,
} from '@/common/types';
import { safeColor } from '@/common/util';
import { CanvasKitModule } from '@/lib/canvaskit';
import { Canvas, Paint } from 'canvaskit-wasm';
import { SRenderComponent } from '../RenderComponents/SRenderComponent';

export class SGeo extends SRenderComponent {
    protected fillPaint!: Paint;
    protected strokePaint!: Paint;

    protected shadowPaint!: Paint;
    public options: SNodeConfig.SGraphicsPropsAndStyle = {};

    private _alpha: number = 1;
    protected onCreated(): void {}

    protected onApplyStyle(): void {}

    protected _getShadowPaint(): Paint {
        if (!this.shadowPaint) {
            this.shadowPaint = new CanvasKitModule.CanvasKit.Paint();
        }
        return this.shadowPaint;
    }

    protected _getFillPaint(): Paint {
        if (!this.fillPaint) {
            this.fillPaint = new CanvasKitModule.CanvasKit.Paint();
            this.fillPaint.setStyle(CanvasKitModule.CanvasKit.PaintStyle.Fill);
            this.fillPaint.setAntiAlias(true);
        }
        return this.fillPaint;
    }

    protected _getStrokePaint(): Paint {
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
        if (this.shadowPaint && this._alpha !== 0) {
            this.drawShadow(_canvas, this.shadowPaint);
        }
        if (this.fillPaint && this._alpha !== 0) {
            this.drawShape(_canvas, this.fillPaint);
        }
        if (this.strokePaint && this._alpha !== 0) {
            this.drawShape(_canvas, this.strokePaint);
        }
    }

    public drawShape(_canvas: Canvas, _paint: Paint): void {}

    public drawShadow(_canvas: Canvas, _paint: Paint): void {}

    public fill(options?: FillOptions): void {
        const paint = this._getFillPaint();
        if (options?.color !== undefined) {
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
        if (options?.width) {
            paint.setStrokeWidth(options.width);
        }
    }

    public setAlpha(alpha: number): void {
        const fillPaint = this._getFillPaint();
        fillPaint.setAlphaf(alpha);
        const strokePaint = this._getStrokePaint();
        strokePaint.setAlphaf(alpha);
        const shadowPaint = this._getShadowPaint();
        shadowPaint.setAlphaf(alpha);
        this._alpha = alpha;
    }

    public applyStyle(options: SNodeConfig.SGraphicsPropsAndStyle): void {
        this.options = { ...options };
        let alpha = undefined;
        if (options.style?.alpha) {
            alpha = options.style.alpha;
        }
        if (options.style?.fill !== undefined) {
            this.fill({ color: options.style.fill, alpha });
        }
        if (options.style?.stroke !== undefined) {
            this.stroke({
                color: options.style.stroke,
                alpha,
                width: options.style.strokeWidth,
            });
        }
        if (options.style?.shadow) {
            this.shadow(options.style.shadow);
        }
        this.onApplyStyle();
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

    public clone(): this {
        const newGeo = new (this.constructor as new () => this)();
        newGeo.applyStyle(this.options);
        return newGeo;
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
