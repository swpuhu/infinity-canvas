import { CanvasKitModule } from '@/lib/canvaskit';
import { CanvasEventSystem } from './EventManager';
import { Renderer } from './renderer';
import { SScene } from './SScene';
import { SNodeEvents } from '@/common/types';

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

        const testBlock = scene.rootNode.getNodeByName('test-block');
        console.log('testBlock', testBlock);
        if (testBlock) {
            this.eventSystem.addEventListener(
                testBlock,
                SNodeEvents.POINTER_DOWN,
                () => {
                    console.log('testBlock pointerdown');
                }
            );
        }

        // 添加示例元素

        this._renderer?.render(scene.rootNode);
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
    }
}
