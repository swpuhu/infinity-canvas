import { Canvas } from 'canvaskit-wasm';
import type { CanvasKit } from 'canvaskit-wasm';
import type SNode from '../SNode';

export abstract class SRenderComponent {
    public node: SNode | undefined;

    public init(): void {
        this.onCreated();
    }

    protected abstract onCreated(): void;

    public abstract draw(canvas: Canvas): void;

    public destroy(): void {}
}
