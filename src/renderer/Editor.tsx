import eventBus from '@/common/eventBus';
import { EventNames } from '@/common/types';
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
