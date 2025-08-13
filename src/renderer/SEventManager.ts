import { SNodeEvents } from '@/common/types';
import SNode from './SNode';
import eventBus from '@/common/eventBus';
import { compareNodeDepth } from '@/common/util';
import { SKeyboardEvent, SPointerEvent, SWheelEvent } from './SEvents';

const DB_CLICK_TIME_THRESHOLD = 200;

export class SListener<T extends keyof SNodeEvents.EventMap> {
    private _node: SNode;
    private _type: T;
    private _handler: (event: SNodeEvents.EventMap[T]) => void;

    constructor(
        node: SNode,
        type: T,
        handler: (event: SNodeEvents.EventMap[T]) => void
    ) {
        this._node = node;
        this._type = type;
        this._handler = handler;
    }

    get node(): SNode {
        return this._node;
    }

    get type(): T {
        return this._type;
    }

    get handler(): (event: SNodeEvents.EventMap[T]) => void {
        return this._handler;
    }
}

export class CanvasEventSystem {
    private canvas: HTMLCanvasElement;
    private _listenersMap = new Map<
        keyof SNodeEvents.EventMap,
        Array<SListener<any>>
    >();

    private _systemListenersMap = new Map<
        keyof SNodeEvents.EventMap,
        ((event: any) => void)[]
    >();

    private _pressed = false;

    private _prevPointerDownTime = 0;

    static initialize(canvas: HTMLCanvasElement): CanvasEventSystem {
        if (this._instance) {
            throw new Error('CanvasEventSystem is already initialized');
        }
        this._instance = new CanvasEventSystem(canvas);
        return this._instance;
    }

    static _instance: CanvasEventSystem | null = null;
    static get instance(): CanvasEventSystem {
        if (!this._instance) {
            throw new Error('CanvasEventSystem is not initialized');
        }
        return this._instance;
    }

    private constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this._preventDefaultBehavior();
        this._delegateDOMEvents();
        this._listenersMap.set(SNodeEvents.POINTER_DOWN, []);
        this._listenersMap.set(SNodeEvents.POINTER_MOVE, []);
        this._listenersMap.set(SNodeEvents.POINTER_UP, []);

        this._systemListenersMap.set(SNodeEvents.KEY_DOWN, []);
        this._systemListenersMap.set(SNodeEvents.KEY_UP, []);
        this._systemListenersMap.set(SNodeEvents.WHEEL, []);
        this._systemListenersMap.set(SNodeEvents.POINTER_MOVE, []);

        eventBus.onHierarchyChange(this._sortListeners);
    }

    private _preventDefaultBehavior(): void {
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            // event.stopPropagation();
        });
    }

    private _delegateDOMEvents() {
        this._handlePointerEvents();

        this._handleKeyboardEvents();

        this._handleWheelEvents();
    }

    private _handleKeyboardEvents() {
        this.canvas.addEventListener(
            SNodeEvents.KEY_DOWN,
            this._handleKeyDownEvents
        );

        this.canvas.addEventListener(
            SNodeEvents.KEY_UP,
            this._handleKeyUpEvents
        );
    }
    private _handleWheelEvents() {
        this.canvas.addEventListener(
            SNodeEvents.WHEEL,
            this._processWheelEvent
        );
    }

    private _handleKeyDownEvents = (event: KeyboardEvent) => {
        this._processKeyboardEvent(SNodeEvents.KEY_DOWN, event);
    };

    private _handleKeyUpEvents = (event: KeyboardEvent) => {
        this._processKeyboardEvent(SNodeEvents.KEY_UP, event);
    };

    private _processKeyboardEvent(
        eventType: keyof SNodeEvents.EventMap,
        nativeEvent: KeyboardEvent
    ) {
        const handlers = this._systemListenersMap.get(eventType);
        if (!handlers || handlers.length === 0) {
            return;
        }
        const event = new SKeyboardEvent(eventType, nativeEvent);

        for (const handler of handlers) {
            handler(event);
        }
    }

    private _processWheelEvent = (event: WheelEvent) => {
        const handlers = this._systemListenersMap.get(SNodeEvents.WHEEL);
        if (!handlers || handlers.length === 0) {
            return;
        }
        const wheelEvent = new SWheelEvent(event);

        for (const handler of handlers) {
            handler(wheelEvent);
        }
    };

    private _processSystemPointerEvent(
        eventType: keyof SNodeEvents.EventMap,
        nativeEvent: PointerEvent
    ) {
        const handlers = this._systemListenersMap.get(eventType);
        if (!handlers || handlers.length === 0) {
            return;
        }
        const pointerEvent = new SPointerEvent(eventType, nativeEvent);
        pointerEvent.button = nativeEvent.button;

        for (const handler of handlers) {
            handler(pointerEvent);
        }
    }

    private _handlePointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
            return;
        }
        this._pressed = true;

        this._processSystemPointerEvent(SNodeEvents.POINTER_DOWN, event);
        this._processPointerEvent(SNodeEvents.POINTER_DOWN, event);

        // 处理双击事件
        const now = Date.now();
        const diff = now - this._prevPointerDownTime;
        // console.log(diff);
        if (diff < DB_CLICK_TIME_THRESHOLD) {
            this._processPointerEvent(SNodeEvents.DB_CLICK, event);
            this._prevPointerDownTime = 0;
            return;
        }
        this._prevPointerDownTime = now;
    };

    private _handlePointerMove = (event: PointerEvent) => {
        // 处理系统级的鼠标移动事件（无论是否按下）
        this._processSystemPointerEvent(SNodeEvents.POINTER_MOVE, event);
        this._processPointerEvent(SNodeEvents.PURE_POINTER_MOVE, event);

        // 原有的逻辑：只在按下状态时处理节点事件
        if (!this._pressed) {
            return;
        }
        this._processPointerEvent(SNodeEvents.POINTER_MOVE, event);
    };

    private _handlePointerUp = (event: PointerEvent) => {
        if (event.button !== 0) {
            return;
        }
        try {
            this._processPointerEvent(SNodeEvents.POINTER_UP, event);
        } catch (e) {
            console.error(e);
        } finally {
            this._pressed = false;
        }
    };

    private _processPointerEvent(
        eventType: keyof SNodeEvents.EventMap,
        nativeEvent: PointerEvent
    ) {
        const listeners = this._listenersMap.get(eventType);
        if (!listeners || listeners.length === 0) {
            return;
        }

        let shouldStopPropagation = false;
        let isFirst = true;
        const pointerEvent = new SPointerEvent(eventType, nativeEvent);
        pointerEvent.button = nativeEvent.button;
        for (const listener of listeners) {
            if (shouldStopPropagation) {
                break;
            }

            if (!listener.node.activeInHierarchy) {
                continue;
            }

            if (
                listener.node.hitTest([
                    nativeEvent.offsetX,
                    nativeEvent.offsetY,
                ])
            ) {
                if (isFirst) {
                    isFirst = false;
                    pointerEvent.setTarget(listener.node);
                }
                pointerEvent.setCurrentTarget(listener.node);
                shouldStopPropagation = this._dispatchPointerEvent(
                    listener,
                    pointerEvent
                );
            }
        }
    }

    private _handlePointerEvents() {
        this.canvas.addEventListener(
            SNodeEvents.POINTER_DOWN,
            this._handlePointerDown
        );

        this.canvas.addEventListener(
            SNodeEvents.POINTER_MOVE,
            this._handlePointerMove
        );

        this.canvas.addEventListener(
            SNodeEvents.POINTER_UP,
            this._handlePointerUp
        );
    }

    private _dispatchPointerEvent<T extends keyof SNodeEvents.EventMap>(
        listener: SListener<T>,
        event: SNodeEvents.EventMap[T]
    ): boolean {
        listener.node.emit(listener.type, event);
        eventBus.reDraw();

        return event.isStopPropagation();
    }

    // 添加事件监听器
    addEventListener<T extends keyof SNodeEvents.EventMap>(
        sNode: SNode,
        type: T,
        handler: (event: SNodeEvents.EventMap[T]) => void
    ) {
        // 暂时就支持pointerEvent
        const originalListeners = this._listenersMap.get(type);
        if (!originalListeners) {
            this._listenersMap.set(type, [new SListener(sNode, type, handler)]);
        } else {
            originalListeners.push(new SListener(sNode, type, handler));
        }

        sNode.on(type, handler);
        // if (type === SNodeEvents.POINTER_MOVE) {
        //     console.log(originalListeners);
        // }
        this._sortListeners(type);
    }

    addSystemEventListener<T extends keyof SNodeEvents.EventMap>(
        type: T,
        handler: (event: SNodeEvents.EventMap[T]) => void
    ) {
        // 暂时就支持pointerEvent
        const originalListeners = this._systemListenersMap.get(type);
        if (!originalListeners) {
            this._systemListenersMap.set(type, [handler]);
        } else {
            originalListeners.push(handler);
        }
    }

    removeSystemEventListener<T extends keyof SNodeEvents.EventMap>(
        type: T,
        handler: (event: SNodeEvents.EventMap[T]) => void
    ) {
        const listeners = this._systemListenersMap.get(type);
        if (!listeners) {
            return;
        }
        const index = listeners.findIndex((l) => l === handler);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    // 移除事件监听器
    removeEventListener<T extends keyof SNodeEvents.EventMap>(
        sNode: SNode,
        type: T,
        handler: (event: SNodeEvents.EventMap[T]) => void
    ) {
        const listeners = this._listenersMap.get(type);
        if (!listeners) {
            return;
        }
        const index = listeners.findIndex(
            (l) => l.node === sNode && l.type === type && l.handler === handler
        );
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        sNode.off(type, handler);
        // console.log(listeners);
        this._sortListeners(type);
    }

    private _sortListeners = (type?: keyof SNodeEvents.EventMap) => {
        if (type) {
            const listeners = this._listenersMap.get(type);
            if (!listeners) {
                return;
            }
            listeners.sort((a, b) => {
                return b.node.zIndex - a.node.zIndex;
            });
            return;
        }
        // 若未指定类型，则重排所有事件类型的监听器
        for (const [_, listeners] of this._listenersMap.entries()) {
            listeners.sort((a, b) => {
                return b.node.zIndex - a.node.zIndex;
            });
        }
    };

    destroy() {
        this.canvas.removeEventListener(
            SNodeEvents.POINTER_DOWN,
            this._handlePointerDown
        );

        this.canvas.removeEventListener(
            SNodeEvents.POINTER_MOVE,
            this._handlePointerMove
        );

        this.canvas.removeEventListener(
            SNodeEvents.POINTER_UP,
            this._handlePointerUp
        );
        this.canvas.removeEventListener(
            SNodeEvents.KEY_DOWN,
            this._handleKeyDownEvents
        );

        this.canvas.removeEventListener(
            SNodeEvents.KEY_UP,
            this._handleKeyUpEvents
        );
        this.canvas.removeEventListener(
            SNodeEvents.WHEEL,
            this._processWheelEvent
        );
        CanvasEventSystem._instance = null;
    }
}
