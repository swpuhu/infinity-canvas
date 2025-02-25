import { ALL_EVENT_NAMES, SNodeEvents } from '@/common/types';
import SNode from './SNode';
import { Vec2 } from '@/common/Vec2';
import eventBus from '@/common/eventBus';
import { ReadonlyVec2 } from 'gl-matrix';
import { compareNodeDepth } from '@/common/util';

const DB_CLICK_TIME_THRESHOLD = 300;
export class SEvent implements SNodeEvents.IEvent {
    private _type: string;
    private _stopPropagation: boolean = false;
    private _target: SNode | null = null;
    private _currentTarget: SNode | null = null;

    constructor(type: string) {
        this._type = type;
    }

    get target(): SNode | null {
        return this._target;
    }

    get currentTarget(): SNode | null {
        return this._currentTarget;
    }

    get type(): string {
        return this._type;
    }

    isStopPropagation(): boolean {
        return this._stopPropagation;
    }

    stopPropagation(): void {
        this._stopPropagation = true;
    }

    setTarget(target: SNode): void {
        this._target = target;
    }

    setCurrentTarget(currentTarget: SNode): void {
        this._currentTarget = currentTarget;
    }
}

export class SPointerEvent extends SEvent implements SNodeEvents.IPointerEvent {
    private _nativeEvent: PointerEvent;
    constructor(type: string, nativeEvent: PointerEvent) {
        super(type);
        this._nativeEvent = nativeEvent;
    }

    getLocalPosition(node: SNode): ReadonlyVec2 {
        return node.toLocal(
            new Vec2(this._nativeEvent.offsetX, this._nativeEvent.offsetY)
        );
    }

    getWorldPosition(): ReadonlyVec2 {
        return [this._nativeEvent.offsetX, this._nativeEvent.offsetY];
    }
}

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

    private _prevPointerUpTime = 0;

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
    }

    private _preventDefaultBehavior(): void {
        this.canvas.addEventListener('contextmenu', event => {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private _delegateDOMEvents() {
        this._handlePointerEvents();
    }

    private _handlePointerDown = (event: PointerEvent) => {
        this._pressed = true;
        let shouldStopPropagation = false;

        const pointerDownListeners = this._listenersMap.get(
            SNodeEvents.POINTER_DOWN
        );
        const pointerEvent = new SPointerEvent(SNodeEvents.POINTER_DOWN, event);
        let isFirst = true;
        for (const listener of pointerDownListeners!) {
            if (shouldStopPropagation) {
                break;
            }
            if (listener.node.hitTest([event.offsetX, event.offsetY])) {
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
    };

    private _handlePointerMove = (event: PointerEvent) => {
        if (!this._pressed) {
            return;
        }
        let shouldStopPropagation = false;
        let isFirst = true;
        const pointerMoveListeners = this._listenersMap.get(
            SNodeEvents.POINTER_MOVE
        );
        const pointerEvent = new SPointerEvent(SNodeEvents.POINTER_MOVE, event);
        for (const listener of pointerMoveListeners!) {
            if (shouldStopPropagation) {
                break;
            }
            if (listener.node.hitTest([event.offsetX, event.offsetY])) {
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
    };

    private _handlePointerUp = (event: PointerEvent) => {
        let shouldInvokeDbClick = false;
        const now = Date.now();
        const diff = now - this._prevPointerUpTime;
        if (diff < DB_CLICK_TIME_THRESHOLD) {
            shouldInvokeDbClick = true;
        }
        this._prevPointerUpTime = now;
        try {
            const pointerUpListeners = this._listenersMap.get(
                SNodeEvents.POINTER_UP
            );
            let shouldStopPropagation = false;
            let isFirst = true;
            const pointerEvent = new SPointerEvent(
                SNodeEvents.POINTER_UP,
                event
            );
            for (const pointerListener of pointerUpListeners!) {
                if (shouldStopPropagation) {
                    break;
                }
                if (
                    pointerListener.node.hitTest([event.offsetX, event.offsetY])
                ) {
                    if (isFirst) {
                        isFirst = false;
                        pointerEvent.setTarget(pointerListener.node);
                    }
                    pointerEvent.setCurrentTarget(pointerListener.node);
                    shouldStopPropagation = this._dispatchPointerEvent(
                        pointerListener,
                        pointerEvent
                    );
                }
            }

            if (shouldInvokeDbClick) {
                // console.log('should invoke dbclick');
                const dbClickListeners = this._listenersMap.get(
                    SNodeEvents.DB_CLICK
                );
                let shouldStopPropagation = false;
                let isFirst = true;
                const pointerEvent = new SPointerEvent(
                    SNodeEvents.DB_CLICK,
                    event
                );
                for (const dbClickListener of dbClickListeners!) {
                    if (shouldStopPropagation) {
                        break;
                    }
                    if (
                        dbClickListener.node.hitTest([
                            event.offsetX,
                            event.offsetY,
                        ])
                    ) {
                        if (isFirst) {
                            isFirst = false;
                            pointerEvent.setTarget(dbClickListener.node);
                        }
                        pointerEvent.setCurrentTarget(dbClickListener.node);
                        shouldStopPropagation = this._dispatchPointerEvent(
                            dbClickListener,
                            pointerEvent
                        );
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            this._pressed = false;
        }
    };

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
        if (type === SNodeEvents.POINTER_MOVE) {
            console.log(originalListeners);
        }
        this._sortListeners();
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
        const index = listeners.findIndex(l => l === handler);
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
            l => l.node === sNode && l.type === type && l.handler === handler
        );
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        sNode.off(type, handler);
        console.log(listeners);
        this._sortListeners();
    }

    private _sortListeners() {
        const listeners = this._listenersMap.get('pointerdown');
        if (!listeners) {
            return;
        }
        listeners.sort((a, b) => {
            return compareNodeDepth(a.node, b.node);
        });
    }

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
        CanvasEventSystem._instance = null;
    }
}
