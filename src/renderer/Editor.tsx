import { CanvasKitModule } from '@/lib/canvaskit';
import { CanvasEventSystem } from './SEventManager';
import { Renderer } from './renderer';
import { SScene } from './SScene';
import { EventNames, SNodeConfig, SNodeEvents } from '@/common/types';
import { ResizeGizmo } from './components/ResizeGizmo';
import SNode from './SNode';
import { SParagraph } from './RenderComponents/SParagraph';
import { createElement } from './createElement';
import eventBus from '@/common/eventBus';
import { createNodeFromConfig } from './util';

export class CanvasEditor {
    private _renderer: Renderer | null = null;
    private _eventSystem: CanvasEventSystem | null = null;

    private _scene: SScene | null = null;
    private _resizeGizmo: ResizeGizmo | null = null;

    constructor(private canvas: HTMLCanvasElement) {}

    get scene(): SScene {
        if (!this._scene) {
            throw new Error('scene is not initialized');
        }
        return this._scene;
    }

    async init() {
        await CanvasKitModule.init();
        this._eventSystem = CanvasEventSystem.initialize(this.canvas);
        this._renderer = new Renderer(this.canvas);
        const canvasSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        // 创建基础布局
        const scene = new SScene({
            canvasSize,
            designSize: { width: 420, height: 640 },
            sideWidth: Math.max(100, window.innerWidth * 0.2),
        });

        this._scene = scene;

        const testPicConfig = (
            <sprite
                props={{
                    url: '/r2.png',
                }}
                transform={{
                    scale: { x: 1, y: 1 },
                    anchor: { x: 0, y: 0 },
                }}
            />
        );
        const testPic = createNodeFromConfig(testPicConfig);
        scene.stage.addChild(testPic);

        const text = new SNode();
        text.anchor.set(0, 0);
        text.width = 500;
        text.position.set(0, 0);

        const para = text.addComponent(SParagraph);
        para.text = '懒羊羊组长赛高！';
        // para.setFontSize(100);

        setTimeout(() => {
            // para.node?.setSize(200, 267);
        }, 1000);
        // eventBus.reDraw();

        scene.stage.addChild(text);
        const a = <container name="resize-gizmo"></container>;

        this._resizeGizmo = new ResizeGizmo(this);

        this._renderer.on(EventNames.RESIZE, (width, height) => {
            scene.resizeCanvasSize({ width, height });
            eventBus.reDraw();
        });

        this._renderer.render(scene.rootNode);
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
