import { ReadonlyVec2, vec2 } from 'gl-matrix';

export const HORIZONTAL_VEC: ReadonlyVec2 = [1, 0];
export const VERTICAL_VEC: ReadonlyVec2 = [0, 1];

export namespace VueCompConsts {
    export const ContextMenuKeys = {
        BRING_FORWARD: 'bringForward',
        SEND_BACKWARD: 'sendBackward',
        BRING_TO_FRONT: 'bringToFront',
        SEND_TO_BACK: 'sendToBack',
        PASTE: 'paste',
        ADD_TEXT: 'addText',
        TOGGLE_GRID: 'toggleGrid',
        ZOOM_IN: 'zoomIn',
        ZOOM_OUT: 'zoomOut',
        SAVE: 'save',
        LAYER: 'layer',
        HAND_TOOL: 'handTool',
        CENTER_CANVAS: 'centerCanvas',
        ACTUAL_SIZE: 'actualSize',
        FIT_WINDOW: 'fitWindow',
    };
}

export const MIN_ZOOM_VALUE = -2;
export const MAX_ZOOM_VALUE = 1.5;
export const ZOOM_STEP = 0.05;

export const DEFAULT_SHADOW_FILL = 0xf0f4fc;
export const DEFAULT_SHADOW_STROKE = 0x000000;
export const DEFAULT_SHADOW_STROKE_WIDTH = 2;
export const DEFAULT_SHADOW_ALPHA = 0.5;

export const DEFAULT_SHADOW_SHAPE_STYLE = {
    fill: DEFAULT_SHADOW_FILL,
    stroke: DEFAULT_SHADOW_STROKE,
    strokeWidth: DEFAULT_SHADOW_STROKE_WIDTH,
    alpha: DEFAULT_SHADOW_ALPHA,
} as const;

export const DEFAULT_SHAPE_STYLE = {
    fill: DEFAULT_SHADOW_FILL,
    stroke: DEFAULT_SHADOW_STROKE,
    strokeWidth: DEFAULT_SHADOW_STROKE_WIDTH,
    alpha: 1,
} as const;

export namespace ConstVectors {
    export const ZERO_VEC: ReadonlyVec2 = vec2.fromValues(0, 0);
    export const LEFT_VEC: ReadonlyVec2 = vec2.fromValues(-1, 0);
    export const RIGHT_VEC: ReadonlyVec2 = vec2.fromValues(1, 0);
    export const UP_VEC: ReadonlyVec2 = vec2.fromValues(0, 1);
    export const DOWN_VEC: ReadonlyVec2 = vec2.fromValues(0, -1);
}
