import type { Canvas, Paint, Path } from 'canvaskit-wasm';
import { SRenderComponent } from './SRenderComponent';
import { CanvasKitModule } from '@/lib/canvaskit';
import { safeColor } from '@/common/util';
import { FillOptions, ShadowOptions, StrokeOptions } from '@/common/types';
import { Vec2 } from '@/common/Vec2';

export class SGraphics extends SRenderComponent {
    private _paths: Path[] = [];
    private _pathStyleMap: Map<Path, Paint> = new Map();

    private _shadowOptionsMap: Map<Path, ShadowOptions> = new Map();

    private _currentPath: Path | null = null;

    private _currentPaint: Paint | null = null;

    private _paints: Paint[] = [];

    private getNewPaint(): Paint {
        const paint = new CanvasKitModule.CanvasKit.Paint();
        this._paints.push(paint);
        return paint;
    }

    private getCurrentPaint(): Paint {
        if (!this._currentPaint) {
            this._currentPaint = this.getNewPaint();
        }
        return this._currentPaint;
    }

    private getCorrespondPaint(path: Path): Paint {
        const paint = this._pathStyleMap.get(path);
        if (!paint) {
            throw new Error('paint not found');
        }
        return paint;
    }
    public beginPath(): void {
        const path = new CanvasKitModule.CanvasKit.Path();
        this._currentPath = path;
        this._paths.push(path);
        const paint = this.getCurrentPaint();
        this._pathStyleMap.set(path, paint);
    }

    public moveTo(x: number, y: number): void {
        if (!this._currentPath) {
            this.beginPath();
        }
        this._currentPath!.moveTo(x, y);
    }

    public lineTo(x: number, y: number): void {
        if (!this._currentPath) {
            this.beginPath();
        }
        this._currentPath!.lineTo(x, y);
    }

    public closePath(): void {
        if (!this._currentPath) {
            throw new Error('No path is being drawn');
        }
        this._currentPath.close();
    }

    public beginNewStyle(): void {
        this._currentPaint = this.getNewPaint();
    }

    public setStrokeWidth(v: number): void {
        const paint = this.getCurrentPaint();

        paint.setStrokeWidth(v);
    }

    public setColor(v: number[]): void {
        const paint = this.getCurrentPaint();
        paint.setColor(v);
    }

    public fill(options?: FillOptions): void {
        const paint = this.getCurrentPaint();
        if (options?.color) {
            const color = safeColor(options.color);
            paint.setColor(color);
        }
        if (options?.alpha) {
            paint.setAlphaf(options?.alpha);
        }
        paint.setStyle(CanvasKitModule.CanvasKit.PaintStyle.Fill);
    }

    public shadow(options: ShadowOptions): void {
        const path = this._currentPath;
        if (!path) {
            return;
        }
        // 克隆原始路径作为阴影路径
        const shadowPath = path.clone();
        const shadowPaint = this.getNewPaint();

        this._shadowOptionsMap.set(shadowPath, options);
        this._pathStyleMap.set(shadowPath, shadowPaint);
        const blurRadius = options.blur || 15;
        const color = safeColor(options.color || 0x000000);

        // 设置阴影效果
        shadowPaint.setMaskFilter(
            CanvasKitModule.CanvasKit.MaskFilter.MakeBlur(
                CanvasKitModule.CanvasKit.BlurStyle.Normal,
                blurRadius,
                true
            )
        );
        shadowPaint.setColor(color);

        // 将阴影路径添加到路径数组的前面，确保先绘制阴影
        const currentPathIndex = this._paths.indexOf(path);
        this._paths.splice(currentPathIndex, 0, shadowPath);
    }

    public stroke(options?: StrokeOptions): void {
        const paint = this.getCurrentPaint();

        if (options?.color) {
            paint.setColor(safeColor(options.color));
        }
        if (options?.width) {
            paint.setStrokeWidth(options.width);
        }
        if (options?.alpha) {
            paint.setAlphaf(options.alpha);
        }
        paint.setStyle(CanvasKitModule.CanvasKit.PaintStyle.Stroke);
    }

    protected onCreated(): void {
        this._pathStyleMap = new Map();
    }

    public draw(canvas: Canvas): void {
        for (let i = 0; i < this._paths.length; i++) {
            const path = this._paths[i];
            const shadowOptions = this._shadowOptionsMap.get(path);
            if (shadowOptions) {
                const shadowPaint = this.getCorrespondPaint(path);
                // 保存当前画布状态
                canvas.save();
                // 对阴影路径应用偏移
                const offsetX = shadowOptions.offset?.[0] || 0;
                const offsetY = shadowOptions.offset?.[1] || 0;
                canvas.translate(offsetX, offsetY);
                canvas.drawPath(path, shadowPaint);
                // 恢复画布状态
                canvas.restore();
                continue;
            }
            const paint = this.getCorrespondPaint(path);
            canvas.drawPath(path, paint);
        }
    }

    public rect(x: number, y: number, width: number, height: number): void {
        this.beginPath();
        const path = this._currentPath!;
        const anchor = this.node?.anchor || new Vec2(0, 0);
        const offsetX = -width * anchor.x;
        const offsetY = -height * anchor.y;
        path.moveTo(x + offsetX, y + offsetY);
        path.lineTo(x + width + offsetX, y + offsetY);
        path.lineTo(x + width + offsetX, y + height + offsetY);
        path.lineTo(x + offsetX, y + height + offsetY);
        path.close();
    }

    public getRectPath(
        x: number,
        y: number,
        width: number,
        height: number
    ): Path {
        const path = new CanvasKitModule.CanvasKit.Path();
        path.moveTo(x, y);
        path.lineTo(x + width, y);
        path.lineTo(x + width, y + height);
        path.lineTo(x, y + height);
        path.close();
        return path;
    }

    public clear(): void {
        this._paints.length = 0;
        this._paths.length = 0;
        this._pathStyleMap.clear();
        this._currentPaint = null;
        this._currentPath = null;
    }

    public destroy(): void {
        this._paints.forEach(paint => {
            paint.delete();
        });
        this._paths.forEach(path => {
            path.delete();
        });
    }
}
