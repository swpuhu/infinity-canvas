import { CanvasKitModule } from '@/lib/canvaskit';
import { Canvas, Paint } from 'canvaskit-wasm';
import { SGeo } from './SGeo';

export class SGeoDashLine extends SGeo {
    protected onCreated(): void {
        const dashPattern = [5, 5];
        const dashEffect = CanvasKitModule.CanvasKit.PathEffect.MakeDash(
            dashPattern,
            0
        );
        this._getStrokePaint().setPathEffect(dashEffect);
        this._getStrokePaint().setAntiAlias(false);
    }

    public drawShape(canvas: Canvas, paint: Paint): void {
        const node = this.node!;
        const left = -node.anchor.x * node.width;
        const right = node.width * (1 - node.anchor.x);
        canvas.drawLine(left, 0, right, 0, paint);
    }

    public drawShadow(_canvas: Canvas, _paint: Paint): void {}
}
