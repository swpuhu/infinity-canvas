import { SNodeEvents } from '@/common/types';
import SNode from './SNode';
import { ReadonlyVec2 } from 'gl-matrix';
import { Vec2 } from '@/common/Vec2';
import { isMacOS } from '@/common/util';

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

    private _fixedWorldPosition: ReadonlyVec2 | null = null;
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

    getFixedWorldPosition(): ReadonlyVec2 {
        if (!this._fixedWorldPosition) {
            return [this._nativeEvent.offsetX, this._nativeEvent.offsetY];
        }
        return this._fixedWorldPosition;
    }

    setFixedWorldPosition(worldPosition: ReadonlyVec2): void {
        this._fixedWorldPosition = worldPosition;
    }
}

export class SKeyboardEvent
    extends SEvent
    implements SNodeEvents.IKeyboardEvent
{
    private _nativeEvent: KeyboardEvent;
    constructor(type: string, nativeEvent: KeyboardEvent) {
        super(type);
        this._nativeEvent = nativeEvent;
    }

    get key(): string {
        return this._nativeEvent.key;
    }

    get code(): string {
        return this._nativeEvent.code;
    }

    get ctrlKey(): boolean {
        if (isMacOS()) {
            return this._nativeEvent.metaKey;
        }
        return this._nativeEvent.ctrlKey;
    }

    get shiftKey(): boolean {
        return this._nativeEvent.shiftKey;
    }

    get altKey(): boolean {
        return this._nativeEvent.altKey;
    }

    get repeat(): boolean {
        return this._nativeEvent.repeat;
    }
}

export class SWheelEvent extends SEvent implements SNodeEvents.IWheelEvent {
    private _nativeEvent: WheelEvent;
    constructor(nativeEvent: WheelEvent) {
        super(SNodeEvents.WHEEL);
        this._nativeEvent = nativeEvent;
    }

    get deltaX(): number {
        return this._nativeEvent.deltaX;
    }

    get deltaY(): number {
        return this._nativeEvent.deltaY;
    }
}
