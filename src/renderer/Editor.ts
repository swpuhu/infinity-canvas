import { CanvasKitModule } from '@/lib/canvaskit';
import { CanvasEventSystem } from './EventManager';
import { Renderer } from './renderer';
import { SScene } from './SScene';
import { EventNames, SNodeConfig, SNodeEvents } from '@/common/types';
import { createNodeFromConfig } from './util';
import { loadImage } from '@/common/util';
import { ResizeGizmo } from './components/ResizeGizmo';

export class CanvasEditor {
    private _renderer: Renderer | null = null;
    private _eventSystem: CanvasEventSystem | null = null;
    constructor(private canvas: HTMLCanvasElement) {}

    async init() {
        await CanvasKitModule.init();
        this._renderer = new Renderer(this.canvas);
        this._eventSystem = new CanvasEventSystem(this.canvas, this._renderer);
        const canvasSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        // 创建基础布局
        const scene = new SScene({
            canvasSize,
            designSize: { width: 1920, height: 1080 },
            sideWidth: 200,
        });

        const testPic = createNodeFromConfig({
            type: SNodeConfig.NodeType.SPRITE,
            props: {
                url: '/r2.png',
            },
            transform: {
                scale: { x: 5, y: 5 },
            },
        });

        scene.stage.addChild(testPic);

        const resizeGizmo = new ResizeGizmo(scene);

        this._renderer.on(EventNames.RESIZE, (width, height) => {
            scene.resizeCanvasSize({ width, height });
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this._renderer.render(scene.rootNode);

        this.eventSystem.addEventListener(
            testPic,
            SNodeEvents.POINTER_DOWN,
            (e: SNodeEvents.PointerEvent) => {
                console.log(e);
                testPic.rotation = 30;
                resizeGizmo.attachToNode(testPic);
            }
        );

        // console.log(img.width);
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
    }
}
