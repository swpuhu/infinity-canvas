import { Canvas, Paint, Path } from 'canvaskit-wasm';
import { SGeo } from './SGeo';
import { SNodeEvents } from '@/common/types';
import { CanvasKitModule } from '@/lib/canvaskit';

export class SGeoParallelogram extends SGeo {
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

        // 计算平行四边形的四个顶点，考虑anchor的影响
        const halfWidth = node.width / 2;
        const halfHeight = node.height / 2;

        // 相对于anchor点的偏移
        const centerX = node.width * (0.5 - node.anchor.x);
        const centerY = node.height * (0.5 - node.anchor.y);

        // 30度倾斜角度的偏移量
        const skewAngle = (30 * Math.PI) / 180; // 转换为弧度
        const skewOffset = halfHeight * Math.tan(skewAngle); // 水平偏移量

        // 平行四边形的四个顶点
        const topLeft = [
            centerX - halfWidth + skewOffset,
            centerY - halfHeight,
        ]; // 左上顶点
        const topRight = [
            centerX + halfWidth + skewOffset,
            centerY - halfHeight,
        ]; // 右上顶点
        const bottomRight = [
            centerX + halfWidth - skewOffset,
            centerY + halfHeight,
        ]; // 右下顶点
        const bottomLeft = [
            centerX - halfWidth - skewOffset,
            centerY + halfHeight,
        ]; // 左下顶点

        // 创建平行四边形路径
        path.moveTo(topLeft[0], topLeft[1]);
        path.lineTo(topRight[0], topRight[1]);
        path.lineTo(bottomRight[0], bottomRight[1]);
        path.lineTo(bottomLeft[0], bottomLeft[1]);
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
