import { ALL_EVENT_NAMES, SNodeEvents } from '@/common/types';
import SNode from './SNode';
import { Vec2 } from '@/common/Vec2';
import eventBus from '@/common/eventBus';

const setPointerEvent = (
    event: PointerEvent,
    sEvent: SNodeEvents.PointerEvent,
    targetNode: SNode
) => {
    const offset = new Vec2(event.offsetX, event.offsetY);
    sEvent.worldPosition.set(offset.x, offset.y);
    const localPos = targetNode.toLocal(sEvent.worldPosition);
    sEvent.localPosition.set(localPos[0], localPos[1]);
    sEvent.target = targetNode;
};

const clearPointerEvent = (sEvent: SNodeEvents.PointerEvent) => {
    sEvent.target = null;
    sEvent.localPosition.set(0, 0);
    sEvent.worldPosition.set(0, 0);
    sEvent.swallow = false;
};

const createPointerEvent = (): SNodeEvents.PointerEvent => {
    return {
        localPosition: new Vec2(0, 0),
        worldPosition: new Vec2(0, 0),
        delta: new Vec2(0, 0),
        target: null,
        swallow: false,
    };
};

export class CanvasEventSystem {
    private canvas: HTMLCanvasElement;
    private _nodeListenerMap: Map<keyof SNodeEvents.EventMap, SNode[]> =
        new Map();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this._initNodeListenerMap();

        this._delegateDOMEvents();
    }

    private _initNodeListenerMap() {
        this._nodeListenerMap = new Map();
        const events = ALL_EVENT_NAMES;
        events.forEach(event => {
            this._nodeListenerMap.set(event, []);
        });
    }

    private _delegateDOMEvents() {
        this._handlePointerEvents();
    }

    private _handlePointerEvents() {
        const nodeEventMap = new Map<SNode, SNodeEvents.PointerEvent>();
        this.canvas.addEventListener('pointerdown', event => {
            nodeEventMap.clear();
            const offset = new Vec2(event.offsetX, event.offsetY);
            const pointerEventNodes =
                this._nodeListenerMap.get(SNodeEvents.POINTER_DOWN) || [];

            for (const node of pointerEventNodes) {
                const isHit = this.hitTest(offset.x, offset.y, node);

                if (isHit) {
                    const newPointerEvent = createPointerEvent();
                    nodeEventMap.set(node, newPointerEvent);
                    setPointerEvent(event, newPointerEvent, node);
                    this.dispatchEvent(node, newPointerEvent);
                    node.emit(SNodeEvents.POINTER_DOWN, newPointerEvent);
                    eventBus.reDraw();
                }
            }
        });

        this.canvas.addEventListener('pointermove', event => {
            for (const [node, pointerEvent] of nodeEventMap.entries()) {
                if (pointerEvent.target) {
                    setPointerEvent(event, pointerEvent, pointerEvent.target);
                    this.dispatchEvent(node, pointerEvent);
                    node.emit(SNodeEvents.POINTER_MOVE, pointerEvent);
                }
            }
        });

        this.canvas.addEventListener('pointerup', event => {
            for (const [node, pointerEvent] of nodeEventMap.entries()) {
                if (pointerEvent.target) {
                    setPointerEvent(event, pointerEvent, pointerEvent.target);
                    this.dispatchEvent(node, pointerEvent);
                    node.emit(SNodeEvents.POINTER_UP, pointerEvent);
                    clearPointerEvent(pointerEvent);
                }
            }
            nodeEventMap.clear();
        });
    }

    // 命中检测：递归查找被点击的SNode
    hitTest(worldX: number, worldY: number, node: SNode): boolean {
        if (!node.visible || !node.hitTest(worldX, worldY)) {
            return false;
        }

        return true;
    }

    // 事件派发（冒泡阶段）
    dispatchEvent(node: SNode, event: SNodeEvents.PointerEvent) {
        // 构建冒泡路径（从当前节点到根节点）
        const path: SNode[] = [];
        let current: SNode | null = node;
        while (current) {
            path.push(current);
            current = current.parent;
        }

        // 捕获阶段（暂未实现，可按需扩展）
        // path.reverse().forEach(node => { ... });
    }

    // 添加事件监听器
    addEventListener<K extends keyof SNodeEvents.EventMap>(
        sNode: SNode,
        type: K,
        handler: SNodeEvents.EventHandler<K>
    ) {
        const eventTypeNodes = this._nodeListenerMap.get(type);
        if (!eventTypeNodes) {
            throw new Error(`Event type ${type} not found`);
        }
        eventTypeNodes.push(sNode);
        sNode.on(type, handler);
    }

    // 移除事件监听器
    removeEventListener<K extends keyof SNodeEvents.EventMap>(
        sNode: SNode,
        type: K,
        handler: SNodeEvents.EventHandler<K>
    ) {
        const eventTypeNodes = this._nodeListenerMap.get(type);
        if (!eventTypeNodes) {
            throw new Error(`Event type ${type} not found`);
        }
        const index = eventTypeNodes.indexOf(sNode);
        if (index !== -1) {
            const node = eventTypeNodes[index];
            node.off(type, handler);
            eventTypeNodes.splice(index, 1);
        }
    }

    destroy() {
        for (const [key, value] of this._nodeListenerMap.entries()) {
            value.forEach(node => {
                node.off(key);
            });
        }

        this._nodeListenerMap.clear();
    }
}
