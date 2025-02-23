import { Canvas } from 'canvaskit-wasm';
import type { CanvasKit } from 'canvaskit-wasm';
import type SNode from '../SNode';

export abstract class SRenderComponent {
    public node: SNode | undefined;
    private _isEnabled: boolean = true;
    public init(): void {
        this.onCreated();
    }

    protected abstract onCreated(): void;

    public abstract draw(canvas: Canvas): void;

    public destroy(): void {}

    public disable(): void {
        this._isEnabled = false;
    }

    public enable(): void {
        this._isEnabled = true;
    }

    public get isEnabled(): boolean {
        return this._isEnabled;
    }
}
