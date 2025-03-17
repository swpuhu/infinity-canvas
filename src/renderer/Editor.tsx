import eventBus from '@/common/eventBus';
import { EventNames } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { CanvasKitModule } from '@/lib/canvaskit';
import { ResizeGizmo } from './components/ResizeGizmo';
import { createElement } from './createElement';
import { Renderer } from './renderer';
import { CanvasEventSystem } from './SEventManager';
import { createNodeFromConfig } from './util';
import { WhiteboardScene } from './WhiteboardScene';

export class CanvasEditor {
    private _renderer: Renderer | null = null;
    private _eventSystem: CanvasEventSystem | null = null;

    private _scene: WhiteboardScene | null = null;
    private _resizeGizmo: ResizeGizmo | null = null;
    private _zoomLevel: number = 100; // Default zoom level is 100%

    constructor(private _canvas: HTMLCanvasElement) {
        _canvas.tabIndex = 1;
    }

    get canvas(): HTMLCanvasElement {
        if (!this._canvas) {
            throw new Error('canvas is not initialized');
        }
        return this._canvas;
    }

    get scene(): WhiteboardScene {
        if (!this._scene) {
            throw new Error('scene is not initialized');
        }
        return this._scene;
    }

    async init() {
        await CanvasKitModule.init();
        this._eventSystem = CanvasEventSystem.initialize(this._canvas);
        this._renderer = new Renderer(this._canvas);
        const canvasSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        // 创建基础布局
        const scene = new WhiteboardScene({
            canvasSize,
            designSize: canvasSize,
            sideWidth: 0,
        });

        this._scene = scene;

        const testPicConfig = (
            <sprite
                name="test pic"
                url={'r2.png'}
                transform={{
                    scale: { x: 1, y: 1 },
                    anchor: { x: 0, y: 0 },
                    position: { x: -100, y: -200 },
                }}
            />
        );
        const testPic = createNodeFromConfig(testPicConfig);
        scene.stage.addChild(testPic);

        const paraConfig = (
            <para
                name="text"
                text="懒羊羊组长赛高！"
                fontSize={50}
                transform={{
                    anchor: { x: 0, y: 0 },
                }}
                width={300}
            />
        );

        const para = createNodeFromConfig(paraConfig);
        console.log('para', para);

        scene.stage.addChild(para);

        this._resizeGizmo = new ResizeGizmo(this);

        this._renderer.on(EventNames.RESIZE, (width, height) => {
            scene.resizeCanvasSize({ width, height });
            eventBus.reDraw();
        });

        // test moveIntoButStay
        // setTimeout(() => {
        //     console.log('moveIntoButStay');
        //     moveIntoButStay(para, testPic);

        //     console.log('testPic', testPic);
        //     eventBus.reDraw();
        // }, 1000);

        this._renderer.render(scene.rootNode);
    }

    /**
     * Set the zoom level of the canvas
     * @param zoomLevel Zoom level percentage (e.g., 100 for 100%)
     */
    public setZoom(zoomLevel: number): void {
        if (!this._scene) {
            throw new Error('scene is not initialized');
        }

        // Clamp zoom level between 50% and 200%
        this._zoomLevel = Math.max(50, Math.min(zoomLevel, 200));

        // Calculate scale factor
        const scale = this._zoomLevel / 100;

        // Get the canvas container node
        const canvasContainer =
            this._scene.rootNode.getNodeByName('canvas-container');

        if (canvasContainer) {
            // Get the base scale from the virtual canvas scale
            const baseScale = this._scene.getVirtualCanvasScale();

            // Apply the zoom scale on top of the base scale
            canvasContainer.setTransform({
                scale: new Vec2(baseScale.x * scale, baseScale.y * scale),
            });

            // Trigger a redraw
            eventBus.reDraw();
        }
    }

    /**
     * Get the current zoom level
     * @returns Current zoom level percentage
     */
    public getZoom(): number {
        return this._zoomLevel;
    }

    public saveToImage() {
        if (!this._scene) {
            throw new Error('scene is not initialized');
        }
        this._renderer?.saveToImage(this._scene.getCanvasNode());
    }

    get eventSystem() {
        if (!this._eventSystem) {
            throw new Error('editor is not initialized');
        }
        return this._eventSystem;
    }

    destroy() {
        this._renderer?.destroy();
        this._eventSystem?.destroy();
        CanvasKitModule.destroy();
        this._resizeGizmo?.destroy();
    }
}
