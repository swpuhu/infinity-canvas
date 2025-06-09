import { Canvas, Paint } from 'canvaskit-wasm';
import { SGeo } from './SGeo';

export class SGeoEllipse extends SGeo {
    public drawShape(canvas: Canvas, paint: Paint): void {
        const node = this.node!;
        canvas.drawCircle(0, 0, node.width / 2, paint);
    }

    public drawShadow(canvas: Canvas, paint: Paint): void {
        const node = this.node!;
        canvas.drawCircle(0, 0, node.width / 2, paint);
    }
}
