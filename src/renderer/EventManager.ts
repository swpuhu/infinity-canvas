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
};

const createPointerEvent = (): SNodeEvents.PointerEvent => {
    return {
        localPosition: new Vec2(0, 0),
        worldPosition: new Vec2(0, 0),
        delta: new Vec2(0, 0),
        target: null,
        stopPropagation: false,
    };
};

class Listener<T extends keyof SNodeEvents.EventMap> {
    private _node: SNode;
    private _type: T;
    private _handler: SNodeEvents.EventHandler<T>;
    private _dispatched = false;

    private _event: SNodeEvents.EventMap[T];

    constructor(
        node: SNode,
        type: T,
        handler: SNodeEvents.EventHandler<T>,
        eventCreator: () => SNodeEvents.EventMap[T]
    ) {
        this._node = node;
        this._type = type;
        this._handler = handler;
        this._node.on(type, handler);
        this._event = eventCreator();
    }

    get node() {
        return this._node;
    }

    get type() {
        return this._type;
    }

    get handler() {
        return this._handler;
    }

    get dispatched() {
        return this._dispatched;
    }

    dispatchEvent(nativeEvent: PointerEvent) {
        if (this._dispatched) {
            return;
        }
        setPointerEvent(
            nativeEvent,
            this._event as SNodeEvents.PointerEvent,
            this._node
        );
        this._node._eventPhase = this._type;
        this._node.emit(this._type, this._event);
        this._dispatched = true;
    }

    public reset() {
        this._dispatched = false;
    }
}

export class CanvasEventSystem {
    private canvas: HTMLCanvasElement;

    private _listeners: Listener<keyof SNodeEvents.EventMap>[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this._delegateDOMEvents();
    }

    private _delegateDOMEvents() {
        this._handlePointerEvents();
    }

    private _resetListeners() {
        for (const listener of this._listeners) {
            listener.reset();
        }
    }

    private _handlePointerEvents() {
        const nodeEventMap = new Map<SNode, SNodeEvents.PointerEvent>();
        this.canvas.addEventListener('pointerdown', event => {
            for (const listener of this._listeners) {
                const type = listener.type;
                if (type !== SNodeEvents.POINTER_DOWN) {
                    continue;
                }
                if (listener.node.hitTest(event.offsetX, event.offsetY)) {
                    this._dispatchEvent(listener, event);
                }
            }
        });

        this.canvas.addEventListener('pointermove', event => {
            for (const listener of this._listeners) {
                const type = listener.type;
                if (type !== SNodeEvents.POINTER_MOVE) {
                    continue;
                }
                if (
                    listener.node._eventPhase === SNodeEvents.POINTER_DOWN ||
                    listener.node._eventPhase === SNodeEvents.POINTER_MOVE
                ) {
                    this._dispatchEvent(listener, event);
                }
            }
        });

        this.canvas.addEventListener('pointerup', event => {
            for (const listener of this._listeners) {
                const type = listener.type;
                if (type !== SNodeEvents.POINTER_UP) {
                    continue;
                }
                if (
                    listener.node._eventPhase === SNodeEvents.POINTER_DOWN ||
                    listener.node._eventPhase === SNodeEvents.POINTER_MOVE
                ) {
                    this._dispatchEvent(listener, event);
                }
            }
        });
    }

    // 命中检测：递归查找被点击的SNode
    hitTest(worldX: number, worldY: number, node: SNode): boolean {
        if (!node.visible || !node.hitTest(worldX, worldY)) {
            return false;
        }

        return true;
    }

    private _bubbleEvent(
        nativeEvent: PointerEvent,
        listener: Listener<keyof SNodeEvents.EventMap>
    ) {
        let parent = listener.node.parent;
        while (parent) {
            if (parent.hitTest(nativeEvent.offsetX, nativeEvent.offsetY)) {
                const parentListener = this._listeners.find(
                    l => l.node === parent
                );
                if (parentListener) {
                    parentListener.dispatchEvent(nativeEvent);
                }
            }
            parent = parent.parent;
        }
        this._resetListeners();
    }

    private _dispatchEvent(
        listener: Listener<keyof SNodeEvents.EventMap>,
        nativeEvent: PointerEvent
    ) {
        listener.dispatchEvent(nativeEvent);
        this._bubbleEvent(nativeEvent, listener);

        eventBus.reDraw();
    }

    // 添加事件监听器
    addEventListener<T extends keyof SNodeEvents.EventMap>(
        sNode: SNode,
        type: T,
        handler: SNodeEvents.EventHandler<T>
    ) {
        // 暂时就支持pointerEvent
        const listener = new Listener(sNode, type, handler, createPointerEvent);
        this._listeners.push(
            listener as any as Listener<keyof SNodeEvents.EventMap>
        );
    }

    // 移除事件监听器
    removeEventListener<K extends keyof SNodeEvents.EventMap>(
        sNode: SNode,
        type: K,
        handler: SNodeEvents.EventHandler<K>
    ) {
        this._listeners = this._listeners.filter(
            l => l.node !== sNode || l.type !== type || l.handler !== handler
        );
    }

    destroy() {}
}
