import type {
    CanvasKit,
    Canvas,
    Surface,
    GrDirectContext,
    Image,
} from 'canvaskit-wasm';
import { CanvasKitModule } from './canvaskit';

export interface RenderCacheConfig {
    tileSize?: number;
    maxMemoryMB?: number;
}

export class RenderCache {
    private tiles: CacheTile[] = [];
    private tileSize: number;
    private surface: Surface;
    private grContext: GrDirectContext;
    private frameCount = 0;

    private mainCanvas: Canvas;
    constructor(
        private ck: CanvasKit,
        private canvasElement: HTMLCanvasElement,
        width: number,
        height: number,
        config: RenderCacheConfig = {}
    ) {
        this.tileSize = config.tileSize || 256;

        const webglContext = ck.GetWebGLContext(canvasElement);
        this.grContext = ck.MakeWebGLContext(webglContext)!;
        this.surface = ck.MakeOnScreenGLSurface(
            this.grContext,
            width,
            height,
            CanvasKitModule.CanvasKit.ColorSpace.SRGB
        )!;
        if (!this.surface) throw new Error('Failed to create surface');

        this.mainCanvas = this.surface.getCanvas();
        this.initializeTiles(width, height);
    }

    private initializeTiles(width: number, height: number) {
        const cols = Math.ceil(width / this.tileSize);
        const rows = Math.ceil(height / this.tileSize);

        const renderTarget = this.ck.MakeRenderTarget(
            this.grContext,
            this.tileSize,
            this.tileSize
        )!;
        this.tiles = Array.from({ length: rows * cols }, (_, i) => ({
            x: (i % cols) * this.tileSize,
            y: Math.floor(i / cols) * this.tileSize,
            version: 0,
            snapshot: null,
            dirty: true,
            renderTarget,
        }));
    }

    markDirty(rect: { x: number; y: number; width: number; height: number }) {
        this.tiles.forEach(tile => {
            if (this.checkOverlap(tile, rect)) {
                tile.dirty = true;
                tile.version++;
            }
        });
    }

    renderFrame(renderCallback: (ck: CanvasKit, canvas: Canvas) => void) {
        for (const tile of this.tiles) {
            const offscreenCanvas = tile.renderTarget.getCanvas();
            if (!tile.dirty && tile.snapshot) {
                this.mainCanvas.drawImage(tile.snapshot, tile.x, tile.y);
                continue;
            }

            offscreenCanvas.clear([0, 0, 0, 0]);

            renderCallback(this.ck, offscreenCanvas);

            tile.snapshot = tile.renderTarget.makeImageSnapshot([
                0,
                0,
                this.tileSize,
                this.tileSize,
            ]);
            tile.dirty = false;

            this.mainCanvas.drawImage(tile.snapshot, tile.x, tile.y);
        }

        this.frameCount++;
        if (this.frameCount % 60 === 0) this.cleanupCache();
    }

    private cleanupCache() {
        // 简单的缓存清理策略
        this.tiles
            .filter(t => !t.dirty)
            .sort((a, b) => b.version - a.version)
            .slice(100)
            .forEach(t => (t.snapshot = null));
    }

    private checkOverlap(tile: CacheTile, rect: any) {
        return !(
            tile.x + this.tileSize < rect.x ||
            tile.x > rect.x + rect.width ||
            tile.y + this.tileSize < rect.y ||
            tile.y > rect.y + rect.height
        );
    }
}

interface CacheTile {
    x: number;
    y: number;
    version: number;
    snapshot: Image | null;
    dirty: boolean;
    renderTarget: Surface;
}
