import { Canvas, Paint } from 'canvaskit-wasm';
import { getRectByNode } from '../util';
import { SGeo } from './SGeo';

export class SGeoRect extends SGeo {
    public drawShape(canvas: Canvas, paint: Paint): void {
        const node = this.node!;
        canvas.drawRect(getRectByNode(node), paint);
    }

    public drawShadow(canvas: Canvas, paint: Paint): void {
        const node = this.node!;
        canvas.drawRect(getRectByNode(node), paint);
    }
}
