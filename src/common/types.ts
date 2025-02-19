import { SEvent, SPointerEvent } from '@/renderer/SEventManager';
import SNode from '@/renderer/SNode';
import { ReadonlyVec2 } from 'gl-matrix';

export interface IPoint extends IPointData {
    clone(): IPoint;
    equals(other: IPoint): boolean;
    set(x: number, y: number, update?: boolean): void;
    observeFunc?: () => void;
}

export interface IPointData {
    x: number;
    y: number;
}

export enum EnumCommandIndexType {
    MOVE_TO = 0,
    LINE_TO = 1,
    STROKE = 2,
    FILL = 3,
    CIRCLE = 4,
    CLOSE_PATH = 5,
}

export interface ISize {
    width: number;
    height: number;
}

export type StrokeOptions = {
    color?: number | number[];
    width?: number;
    alpha?: number;
};

export type FillOptions = {
    color?: number | number[];
    alpha?: number;
};

export type ShadowOptions = {
    color?: number | number[];
    blur?: number;
    offset?: [number, number];
};

export type SceneOptions = {
    canvasSize: ISize;
    designSize: ISize;
    sideWidth: number;
};

export type TransformOptions = {
    position?: IPointData;
    scale?: IPointData;
    rotation?: number;
    anchor?: IPointData;
};

export namespace EventNames {
    export const RESIZE = 'resize';
}

export namespace SNodeConfig {
    export interface IRefSNode {
        value: SNode | undefined;
    }

    export enum NodeType {
        RECT = 'rect',
        CONTAINER = 'container',
        SPRITE = 'sprite',
    }

    export type SGraphicsPropsConfig = {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };

    export type SSpritePropsConfig = {
        url?: string;
    };

    export type SGraphicsStyleConfig = {
        fill?: number | number[];
        stroke?: number | number[];
        shadow?: ShadowOptions;
        alpha?: number;
    };

    export type BaseConfig = {
        type: NodeType;
        name?: string;
        width?: number;
        height?: number;
        ref?: IRefSNode;
        needClip?: boolean;
        children?: (BaseConfig | RectConfig)[];
        transform?: TransformOptions;
        active?: boolean;
    };

    export type ContainerConfig = BaseConfig;

    export type RectConfig = BaseConfig & {
        type: NodeType.RECT;
        props: SGraphicsPropsConfig;
        style: SGraphicsStyleConfig;
    };

    export type SpriteConfig = BaseConfig & {
        type: NodeType.SPRITE;
        props: SSpritePropsConfig;
    };

    export type NodeTypeMap = {
        [NodeType.RECT]: RectConfig;
        [NodeType.CONTAINER]: ContainerConfig;
        [NodeType.SPRITE]: SpriteConfig;
    };

    export type Config = NodeTypeMap[keyof NodeTypeMap];
}

export namespace SNodeEvents {
    export const MOUSE_DOWN = 'mousedown';
    export const MOUSE_MOVE = 'mousemove';
    export const MOUSE_UP = 'mouseup';

    export const POINTER_DOWN = 'pointerdown';
    export const POINTER_MOVE = 'pointermove';
    export const POINTER_UP = 'pointerup';

    export const KEY_DOWN = 'keydown';
    export const KEY_UP = 'keyup';

    export const TOUCH_START = 'touchstart';
    export const TOUCH_MOVE = 'touchmove';
    export const TOUCH_END = 'touchend';
    export const TOUCH_CANCEL = 'touchcancel';

    export const WHEEL = 'wheel';

    export const HIERARCHY_CHANGE = 'hierarchyChange';
    export const SIZE_CHANGE = 'sizeChange';

    export type IEvent = {
        target: SNode | null;
        stopPropagation: () => void;
        currentTarget: SNode | null;
    };

    type MouseEvent = {} & IEvent;
    export type IPointerEvent = IEvent & {
        getLocalPosition: (node: SNode) => ReadonlyVec2;
        getWorldPosition: () => ReadonlyVec2;
    };
    type TouchEvent = {} & IEvent;
    type KeyboardEvent = {} & IEvent;
    type WheelEvent = {} & IEvent;

    export type EventMap = {
        [SNodeEvents.MOUSE_DOWN]: MouseEvent;
        [SNodeEvents.MOUSE_MOVE]: MouseEvent;
        [SNodeEvents.MOUSE_UP]: MouseEvent;
        [SNodeEvents.POINTER_DOWN]: IPointerEvent;
        [SNodeEvents.POINTER_MOVE]: IPointerEvent;
        [SNodeEvents.POINTER_UP]: IPointerEvent;
        [SNodeEvents.KEY_DOWN]: KeyboardEvent;
        [SNodeEvents.KEY_UP]: KeyboardEvent;
        [SNodeEvents.TOUCH_START]: TouchEvent;
        [SNodeEvents.TOUCH_MOVE]: TouchEvent;
        [SNodeEvents.TOUCH_END]: TouchEvent;
        [SNodeEvents.TOUCH_CANCEL]: TouchEvent;
        [SNodeEvents.WHEEL]: WheelEvent;
    };

    export type EventHandler<T extends keyof EventMap> = (
        event: EventMap[T]
    ) => void;
}

export const ALL_EVENT_NAMES: (keyof SNodeEvents.EventMap)[] = [
    SNodeEvents.MOUSE_DOWN,
    SNodeEvents.MOUSE_MOVE,
    SNodeEvents.MOUSE_UP,
    SNodeEvents.POINTER_DOWN,
    SNodeEvents.POINTER_MOVE,
    SNodeEvents.POINTER_UP,
    SNodeEvents.KEY_DOWN,
    SNodeEvents.KEY_UP,
    SNodeEvents.TOUCH_START,
    SNodeEvents.TOUCH_MOVE,
    SNodeEvents.TOUCH_END,
    SNodeEvents.TOUCH_CANCEL,
];

export enum EnumAspectKeepMode {
    NONE = 'none',
    WIDTH = 'width',
    HEIGHT = 'height',
}
