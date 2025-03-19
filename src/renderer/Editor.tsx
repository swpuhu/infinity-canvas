import eventBus from '@/common/eventBus';
import { EventNames, IPoint } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { CanvasKitModule } from '@/lib/canvaskit';
import { ResizeGizmo } from './components/ResizeGizmo';
import { SnapGuide } from './components/SnapGuide';
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
    private _snapGuide: SnapGuide | null = null;
    private _zoomValue: number = 0; // Default zoom value is 0 (100% scale)
    private _minZoomValue: number = -2; // Minimum zoom value (~13.5% scale)
    private _maxZoomValue: number = 1.5; // Maximum zoom value (~448% scale)
    private _canvasPosition: Vec2 = new Vec2(0, 0); // Position of the canvas container

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
        this._snapGuide = new SnapGuide(this);

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
     * Set the zoom value of the canvas
     * @param zoomValue Zoom value (can be negative)
     * @param centerX Optional X coordinate to zoom around (in canvas coordinates)
     * @param centerY Optional Y coordinate to zoom around (in canvas coordinates)
     */
    public setZoomValue(
        zoomValue: number,
        centerX?: number,
        centerY?: number
    ): void {
        if (!this._scene) {
            throw new Error('scene is not initialized');
        }

        // Get the old zoom value before clamping
        const oldZoomValue = this._zoomValue;

        // Clamp zoom value between min and max
        this._zoomValue = Math.max(
            this._minZoomValue,
            Math.min(zoomValue, this._maxZoomValue)
        );

        // If zoom value didn't change, do nothing
        if (oldZoomValue === this._zoomValue) {
            return;
        }

        // Calculate scale factors using exponential function
        const oldScale = Math.exp(oldZoomValue);
        const newScale = Math.exp(this._zoomValue);
        const scaleFactor = newScale / oldScale;

        // Get the canvas container node
        const canvasContainer =
            this._scene.rootNode.getNodeByName('canvas-container');

        if (canvasContainer) {
            // Get the base scale from the virtual canvas scale
            const baseScale = this._scene.getVirtualCanvasScale();

            // Apply the zoom scale on top of the base scale
            const newScaleX = baseScale.x * newScale;
            const newScaleY = baseScale.y * newScale;

            // If center coordinates are provided, adjust position to zoom around that point
            if (centerX !== undefined && centerY !== undefined) {
                // Get the root node position (center of the canvas)
                const rootPosition = this._scene.rootNode.position;

                // Calculate the position of the canvas container relative to the root
                // By default, the canvas container is centered at the root
                const containerPos = canvasContainer.position;

                // Calculate the point to zoom around, relative to the container's center
                const zoomCenterX = centerX - rootPosition.x;
                const zoomCenterY = centerY - rootPosition.y;

                // Calculate the new position to maintain the zoom center point
                // Formula: newPos = zoomCenter - (zoomCenter - oldPos) * scaleFactor
                const newX =
                    zoomCenterX - (zoomCenterX - containerPos.x) * scaleFactor;
                const newY =
                    zoomCenterY - (zoomCenterY - containerPos.y) * scaleFactor;

                // Apply new position and scale
                canvasContainer.setTransform({
                    position: new Vec2(newX, newY),
                    scale: new Vec2(newScaleX, newScaleY),
                });
            } else {
                // Just update the scale without changing position
                canvasContainer.setTransform({
                    scale: new Vec2(newScaleX, newScaleY),
                });
            }

            // Trigger a redraw
            eventBus.reDraw();
        }
    }

    /**
     * Set the zoom percentage of the canvas
     * @param percentage Zoom percentage (e.g., 100 for 100%)
     * @param centerX Optional X coordinate to zoom around (in canvas coordinates)
     * @param centerY Optional Y coordinate to zoom around (in canvas coordinates)
     */
    public setZoomPercentage(
        percentage: number,
        centerX?: number,
        centerY?: number
    ): void {
        // Convert percentage to zoom value using natural logarithm
        const zoomValue = Math.log(percentage / 100);
        this.setZoomValue(zoomValue, centerX, centerY);
    }

    /**
     * Get the current zoom value
     * @returns Current zoom value
     */
    public getZoomValue(): number {
        return this._zoomValue;
    }

    /**
     * Get the current zoom percentage
     * @returns Current zoom percentage
     */
    public getZoomPercentage(): number {
        return Math.round(Math.exp(this._zoomValue) * 100);
    }

    /**
     * Get the canvas position in screen coordinates
     * @returns Canvas position
     */
    public getCanvasPosition(): IPoint {
        return this._scene!.canvasContainer.position;
    }

    /**
     * Convert screen coordinates to canvas coordinates
     * @param screenX Screen X coordinate
     * @param screenY Screen Y coordinate
     * @returns Canvas coordinates
     */
    public screenToCanvasCoordinates(screenX: number, screenY: number): Vec2 {
        if (!this._scene) {
            throw new Error('scene is not initialized');
        }

        const canvasContainer =
            this._scene.rootNode.getNodeByName('canvas-container');
        if (!canvasContainer) {
            return new Vec2(screenX, screenY);
        }

        // Get current scale
        const scale = Math.exp(this._zoomValue);
        const baseScale = this._scene.getVirtualCanvasScale();
        const totalScaleX = baseScale.x * scale;
        const totalScaleY = baseScale.y * scale;

        // Get canvas container position
        const containerPos = canvasContainer.position;

        // Convert screen coordinates to canvas coordinates
        const canvasX = (screenX - containerPos.x) / totalScaleX;
        const canvasY = (screenY - containerPos.y) / totalScaleY;

        return new Vec2(canvasX, canvasY);
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
