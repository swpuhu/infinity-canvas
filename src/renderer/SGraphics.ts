import type { Canvas, Paint, Path } from 'canvaskit-wasm';
import { SRenderComponent } from './SRenderComponent';
import { CanvasKitModule } from '@/lib/canvaskit';
import { safeColor } from '@/common/util';
import { FillOptions, StrokeOptions } from '@/common/types';

export class SGraphics extends SRenderComponent {
    private _clipPath: Path | null = null;
    private _paths: Path[] = [];
    private _pathStyleMap: Map<Path, Paint> = new Map();

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
        // 如果有裁剪路径，先保存画布状态并应用裁剪
        if (this._clipPath) {
            canvas.save();
            canvas.clipPath(
                this._clipPath,
                CanvasKitModule.CanvasKit.ClipOp.Intersect,
                true
            );
        }

        // 绘制所有路径
        for (let i = 0; i < this._paths.length; i++) {
            const path = this._paths[i];
            const paint = this.getCorrespondPaint(path);
            canvas.drawPath(path, paint);
        }

        // 如果有裁剪，恢复画布状态
        if (this._clipPath) {
            canvas.restore();
        }
    }

    public rect(x: number, y: number, width: number, height: number): void {
        this.beginPath();
        const path = this._currentPath!;
        path.moveTo(x, y);
        path.lineTo(x + width, y);
        path.lineTo(x + width, y + height);
        path.lineTo(x, y + height);
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

    /**
     * 设置裁剪遮罩
     * @param path 用作遮罩的路径
     */
    public clip(path: Path): void {
        this._clipPath = path;
    }

    /**
     * 清除裁剪遮罩
     */
    public clearClip(): void {
        this._clipPath = null;
    }

    public clear(): void {
        this._paths.length = 0;
        this._pathStyleMap.clear();
        this._currentPaint = null;
        this._currentPath = null;
        this._clipPath = null;
    }
}
