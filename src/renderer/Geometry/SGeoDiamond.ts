import { Canvas, Paint, Path } from 'canvaskit-wasm';
import { SGeo } from './SGeo';
import { SNodeEvents } from '@/common/types';
import { CanvasKitModule } from '@/lib/canvaskit';

export class SGeoDiamond extends SGeo {
    private _path: Path | null = null;
    protected onCreated(): void {
        if (!this.node) return;
        this._path = this._createPath();
        this.node.on(SNodeEvents.SIZE_CHANGE, this._onSizeChange, this);
    }

    private _onSizeChange(): void {
        this._path?.delete();
        this._path = this._createPath();
    }

    private _createPath(): Path {
        const node = this.node!;
        const path = new CanvasKitModule.CanvasKit.Path();

        // 计算菱形的四个顶点，考虑anchor的影响
        const halfWidth = node.width / 2;
        const halfHeight = node.height / 2;

        // 相对于anchor点的偏移
        const centerX = node.width * (0.5 - node.anchor.x);
        const centerY = node.height * (0.5 - node.anchor.y);

        // 菱形的四个顶点
        const topPoint = [centerX, centerY - halfHeight]; // 上顶点
        const rightPoint = [centerX + halfWidth, centerY]; // 右顶点
        const bottomPoint = [centerX, centerY + halfHeight]; // 下顶点
        const leftPoint = [centerX - halfWidth, centerY]; // 左顶点

        // 创建菱形路径
        path.moveTo(topPoint[0], topPoint[1]);
        path.lineTo(rightPoint[0], rightPoint[1]);
        path.lineTo(bottomPoint[0], bottomPoint[1]);
        path.lineTo(leftPoint[0], leftPoint[1]);
        path.close();

        return path;
    }

    public drawShape(canvas: Canvas, paint: Paint): void {
        canvas.drawPath(this._path!, paint);
    }

    public drawShadow(canvas: Canvas, paint: Paint): void {
        canvas.drawPath(this._path!, paint);
    }
}
