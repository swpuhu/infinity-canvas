import SNode from '@/renderer/SNode';
import { InputColor, TextAlign, TextDirection } from 'canvaskit-wasm';
import { ReadonlyVec2 } from 'gl-matrix';

export interface IPoint extends IPointData {
    clone(): IPoint;
    equals(other: IPoint): boolean;
    set(x: number, y: number, update?: boolean): void;
    observeFunc?: () => void;
}

export type Vec2Like = number[] | Float32Array<ArrayBufferLike>;

export const HORIZONTAL_DIR_VALUE = 1;
export const VERTICAL_DIR_VALUE = 2;

export interface ISegment {
    start: IPointData;
    end: IPointData;
    dir: typeof HORIZONTAL_DIR_VALUE | typeof VERTICAL_DIR_VALUE;
}

export interface ILine {
    start: ReadonlyVec2;
    dir: ReadonlyVec2;
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
    export const POINTER_DOWN_NODE = 'pointerDownNode';
    export const DB_CLICK_NODE = 'dbClickNode';
    export const RESIZE_START = 'resizeStart';
    export const DRAG_SELECT_NODE = 'dragSelectNode';
    export const DRAG_SELECT_END = 'dragSelectEnd';
}

export namespace SNodeConfig {
    export interface IRefSNode {
        value: SNode | undefined;
    }

    export enum NodeType {
        RECT = 'rect',
        CONTAINER = 'container',
        SPRITE = 'sprite',
        ELLIPSE = 'ellipse',
        PARAGRAPH = 'para',
        DASH_LINE = 'dash-line',
        TRI = 'tri',
        DIAMOND = 'diamond',
        PARALLELOGRAM = 'parallelogram',
        ROUND_RECT = 'round-rect',
        PENTAGON = 'pentagon',
        HEXAGON = 'hexagon',
        STAR = 'star',
        ARROW_RIGHT = 'arrow-right',
        ARROW_LEFT = 'arrow-left',
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
        strokeWidth?: number;
    };

    export type BaseConfig = {
        type: NodeType;
        name?: string;
        width?: number;
        height?: number;
        ref?: IRefSNode;
        needClip?: boolean;
        children?: SNodeConfig.Config[];
        transform?: TransformOptions;
        active?: boolean;
    };

    export type ContainerConfig = BaseConfig;

    export type SGraphicsPropsAndStyle = {
        props?: SGraphicsPropsConfig;
        style?: SGraphicsStyleConfig;
    };
    export type RectConfig = BaseConfig &
        SGraphicsPropsAndStyle & {
            type: NodeType.RECT;
        };
    export type TriConfig = BaseConfig &
        SGraphicsPropsAndStyle & {
            type: NodeType.TRI;
        };

    export type DashLineConfig = BaseConfig &
        SGraphicsPropsAndStyle & {
            type: NodeType.DASH_LINE;
        };

    export type EllipseConfig = BaseConfig &
        SGraphicsPropsAndStyle & {
            type: NodeType.ELLIPSE;
        };

    export type DiamondConfig = BaseConfig &
        SGraphicsPropsAndStyle & {
            type: NodeType.DIAMOND;
        };

    export type ParallelogramConfig = BaseConfig &
        SGraphicsPropsAndStyle & {
            type: NodeType.PARALLELOGRAM;
        };

    export type SpriteConfig = BaseConfig & SSpritePropsConfig;

    export type SParagraphPropsConfig = {
        text?: string;
        fontSize?: number;
        layoutMode?: EnumParaLayoutMode;
        resizeMode?: EnumParaResizeMode;
        color: InputColor;
        textAlign?: TextAlign;
        textDirection?: TextDirection;
    };

    export type ParagraphConfig = BaseConfig & SParagraphPropsConfig;

    export type NodeTypeMap = {
        [NodeType.RECT]: RectConfig;
        [NodeType.CONTAINER]: ContainerConfig;
        [NodeType.SPRITE]: SpriteConfig;
        [NodeType.ELLIPSE]: EllipseConfig;
    };

    export type Config = NodeTypeMap[keyof NodeTypeMap];
}
export namespace SNodeEvents {
    export const MOUSE_DOWN = 'mousedown';
    export const MOUSE_MOVE = 'mousemove';
    export const MOUSE_UP = 'mouseup';

    export const PURE_POINTER_MOVE = 'purePointerMove';
    export const POINTER_DOWN = 'pointerdown';
    export const POINTER_MOVE = 'pointermove';
    export const POINTER_UP = 'pointerup';
    export const POINTER_CANCEL = 'pointercancel';

    export const KEY_DOWN = 'keydown';
    export const KEY_UP = 'keyup';

    export const TOUCH_START = 'touchstart';
    export const TOUCH_MOVE = 'touchmove';
    export const TOUCH_END = 'touchend';
    export const TOUCH_CANCEL = 'touchcancel';

    export const DRAGGING = 'dragging';
    export const RESIZING = 'resizing';
    export const ROTATING = 'rotating';

    export const DB_CLICK = 'dblclick';

    export const WHEEL = 'wheel';

    export const HIERARCHY_CHANGE = 'hierarchyChange';
    export const SIZE_CHANGE = 'sizeChange';

    export const TEXT_CHANGED = 'textChanged';

    export type IEvent = {
        target: SNode | null;
        stopPropagation: () => void;
        currentTarget: SNode | null;
        setCurrentTarget(currentTarget: SNode): void;
        isStopPropagation: () => boolean;
    };

    type MouseEvent = {} & IEvent;
    export type IPointerEvent = IEvent & {
        getLocalPosition: (node: SNode) => ReadonlyVec2;
        getWorldPosition: () => ReadonlyVec2;
        getFixedWorldPosition: () => ReadonlyVec2;
        setFixedWorldPosition(worldPosition: ReadonlyVec2): void;
    };

    export type IKeyboardEvent = IEvent & {
        key: string;
        code: string;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        repeat: boolean;
    };

    export type IWheelEvent = IEvent & {
        deltaX: number;
        deltaY: number;
    };

    type TouchEvent = {} & IEvent;

    export type EventMap = {
        [SNodeEvents.MOUSE_DOWN]: MouseEvent;
        [SNodeEvents.MOUSE_MOVE]: MouseEvent;
        [SNodeEvents.MOUSE_UP]: MouseEvent;
        [SNodeEvents.POINTER_DOWN]: IPointerEvent;
        [SNodeEvents.POINTER_MOVE]: IPointerEvent;
        [SNodeEvents.POINTER_UP]: IPointerEvent;
        [SNodeEvents.KEY_DOWN]: IKeyboardEvent;
        [SNodeEvents.KEY_UP]: IKeyboardEvent;
        [SNodeEvents.TOUCH_START]: TouchEvent;
        [SNodeEvents.TOUCH_MOVE]: TouchEvent;
        [SNodeEvents.TOUCH_END]: TouchEvent;
        [SNodeEvents.TOUCH_CANCEL]: TouchEvent;
        [SNodeEvents.WHEEL]: IWheelEvent;
        [SNodeEvents.DB_CLICK]: IPointerEvent;
        [SNodeEvents.PURE_POINTER_MOVE]: IPointerEvent;
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

export enum EnumRenderComponentType {
    NONE = 'none',
    SPRITE = 'sprite',
    TEXT = 'text',
}

export enum ResizeGizmoMode {
    EDIT = 'edit',
    RESIZE = 'resize',
    ROTATE = 'rotate',
    DRAG = 'drag',
    NONE = 'none',
}

export enum EnumParaLayoutMode {
    AUTO = 'auto',
    FIXED = 'fixed',
    DEPEND_PARENT = 'dependParent',
}

export enum EnumParaResizeMode {
    ONLY_NODE = 'onlyNode',
    RESIZE_FONT_SIZE = 'resizeFontSize',
}

export type ShapeType = 'rect' | 'round-rect' | 'tri' | 'diamond';

export enum CursorStyle {
    DEFAULT = 'default',
    INSERT = 'insert',
    TEXT_EDIT = 'textEdit',
    RESIZE = 'resize',
    ROTATE = 'rotate',
}

// 定义调整大小的方向类型
export type ResizeDirection =
    | 'nw'
    | 'ne'
    | 'sw'
    | 'se'
    | 'n'
    | 's'
    | 'w'
    | 'e'
    | 'none';
