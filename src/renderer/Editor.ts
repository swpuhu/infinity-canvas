import { CanvasKitModule } from '@/lib/canvaskit';
import { CanvasEventSystem } from './SEventManager';
import { Renderer } from './renderer';
import { SScene } from './SScene';
import { EventNames, SNodeConfig, SNodeEvents } from '@/common/types';
import { createNodeFromConfig } from './util';
import { loadImage } from '@/common/util';
import { ResizeGizmo } from './components/ResizeGizmo';

export class CanvasEditor {
    private _renderer: Renderer | null = null;
    private _eventSystem: CanvasEventSystem | null = null;

    private _scene: SScene | null = null;

    constructor(private canvas: HTMLCanvasElement) {}

    get scene(): SScene {
        if (!this._scene) {
            throw new Error('scene is not initialized');
        }
        return this._scene;
    }

    async init() {
        await CanvasKitModule.init();
        this._renderer = new Renderer(this.canvas);
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

        this._eventSystem = new CanvasEventSystem(this.canvas);

        this._scene = scene;

        const testPic = createNodeFromConfig({
            type: SNodeConfig.NodeType.SPRITE,
            name: 'testPic',
            props: {
                url: '/r2.png',
            },
            transform: {
                scale: { x: 3, y: 3 },
                anchor: { x: 0, y: 0 },
            },
        });

        scene.stage.addChild(testPic);

        const resizeGizmo = new ResizeGizmo(this);

        this._renderer.on(EventNames.RESIZE, (width, height) => {
            scene.resizeCanvasSize({ width, height });
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this._renderer.render(scene.rootNode);

        // testPic.on(SNodeEvents.POINTER_DOWN, (e: SNodeEvents.PointerEvent) => {
        //     console.log(e);
        //     testPic.rotation = 30;
        //     resizeGizmo.mountToNode(testPic);
        // });

        this.eventSystem.addEventListener(
            testPic,
            SNodeEvents.POINTER_DOWN,
            (e: SNodeEvents.IPointerEvent) => {
                e.stopPropagation();
                console.log(e.target?.name, e.currentTarget?.name);
                testPic.rotation = 30;
                resizeGizmo.mountToNode(testPic);
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
