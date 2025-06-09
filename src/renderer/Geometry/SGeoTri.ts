import { Canvas, Paint, Path } from 'canvaskit-wasm';
import { SGeo } from './SGeo';
import { SNodeEvents } from '@/common/types';
import { CanvasKitModule } from '@/lib/canvaskit';

export class SGeoTri extends SGeo {
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
        const p1 = [
            -node.width * node.anchor.x,
            node.height * (1 - node.anchor.y),
        ];
        const p2 = [
            node.width * (1 - node.anchor.x),
            node.height * (1 - node.anchor.y),
        ];
        const p3 = [0, -node.height * node.anchor.y];

        // 创建三角形路径
        path.moveTo(p1[0], p1[1]);
        path.lineTo(p2[0], p2[1]);
        path.lineTo(p3[0], p3[1]);
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
