import SNode from '@/renderer/SNode';

export interface IPoint extends IPointData {
    clone(): IPoint;
    equals(other: IPoint): boolean;
    set(x: number, y: number): void;
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
    export const MOUSE_DOWN = 'mouseDown';
    export const MOUSE_MOVE = 'mouseMove';
    export const MOUSE_UP = 'mouseUp';

    export const POINTER_DOWN = 'pointerDown';
    export const POINTER_MOVE = 'pointerMove';
    export const POINTER_DOWN_MOVE = 'pointerDownMove';
    export const POINTER_UP = 'pointerUp';

    export const KEY_DOWN = 'keyDown';
    export const KEY_UP = 'keyUp';

    export const TOUCH_START = 'touchStart';
    export const TOUCH_MOVE = 'touchMove';
    export const TOUCH_END = 'touchEnd';
    export const TOUCH_CANCEL = 'touchCancel';

    export const WHEEL = 'wheel';

    type Event = {
        target: SNode | null;
        stopPropagation: () => void;
        _stopPropagation: boolean;
    };

    type MouseEvent = {} & Event;
    export type PointerEvent = {
        localPosition: IPoint;
        worldPosition: IPoint;
        delta: IPoint;
    } & Event;
    type TouchEvent = {} & Event;
    type KeyboardEvent = {} & Event;
    type WheelEvent = {} & Event;

    export type EventMap = {
        [SNodeEvents.MOUSE_DOWN]: MouseEvent;
        [SNodeEvents.MOUSE_MOVE]: MouseEvent;
        [SNodeEvents.MOUSE_UP]: MouseEvent;
        [SNodeEvents.POINTER_DOWN]: PointerEvent;
        [SNodeEvents.POINTER_MOVE]: PointerEvent;
        [SNodeEvents.POINTER_UP]: PointerEvent;
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
