import { Canvas, Paint } from 'canvaskit-wasm';
import { getRectByNode } from '../util';
import { SGeo } from './SGeo';

export class SGeoRect extends SGeo {
    public drawShape(_canvas: Canvas, _paint: Paint): void {
        const node = this.node!;
        _canvas.drawRect(getRectByNode(node), _paint);
    }

    public drawShadow(_canvas: Canvas, _paint: Paint): void {
        const node = this.node!;
        _canvas.drawRect(getRectByNode(node), _paint);
    }
}
