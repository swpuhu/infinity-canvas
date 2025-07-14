import { Canvas, Paint, Path } from 'canvaskit-wasm';
import { SGeo } from './SGeo';
import { SNodeEvents } from '@/common/types';
import { CanvasKitModule } from '@/lib/canvaskit';

export class SGeoArrow extends SGeo {
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

        // 计算箭头的尺寸，考虑anchor的影响
        const width = node.width;
        const height = node.height;

        // 相对于anchor点的偏移
        const offsetX = -node.width * node.anchor.x;
        const offsetY = -node.height * node.anchor.y;

        // 箭头参数
        const arrowHeadWidth = Math.min(width * 0.3, 30); // 箭头头部宽度占总宽度的30%
        const arrowBodyHeight = height * 0.4; // 箭头身体高度占总高度的40%
        const arrowBodyWidth = width - arrowHeadWidth; // 箭头身体宽度

        // 箭头身体中心位置
        const bodyStartX = offsetX;
        const bodyEndX = offsetX + arrowBodyWidth;
        const bodyCenterY = offsetY + height / 2;
        const bodyTopY = bodyCenterY - arrowBodyHeight / 2;
        const bodyBottomY = bodyCenterY + arrowBodyHeight / 2;

        // 箭头头部
        const headTipX = offsetX + width;
        const headTipY = bodyCenterY;
        const headTopY = offsetY;
        const headBottomY = offsetY + height;

        // 创建箭头路径
        path.moveTo(bodyStartX, bodyTopY); // 箭头身体左上角
        path.lineTo(bodyEndX, bodyTopY); // 箭头身体右上角
        path.lineTo(bodyEndX, headTopY); // 箭头头部上方
        path.lineTo(headTipX, headTipY); // 箭头尖端
        path.lineTo(bodyEndX, headBottomY); // 箭头头部下方
        path.lineTo(bodyEndX, bodyBottomY); // 箭头身体右下角
        path.lineTo(bodyStartX, bodyBottomY); // 箭头身体左下角
        path.close();

        return path;
    }

    public drawShape(canvas: Canvas, paint: Paint): void {
        canvas.drawPath(this._path!, paint);
    }

    public drawShadow(canvas: Canvas, paint: Paint): void {
        canvas.drawPath(this._path!, paint);
    }

    public destroy(): void {
        this._path?.delete();
    }
}
