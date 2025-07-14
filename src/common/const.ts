import { ReadonlyVec2 } from 'gl-matrix';

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

export const DEFAULT_SHAPE_STYLE = {
    fill: 0xf0f4fc,
    stroke: 0x000000,
    strokeWidth: 2,
    alpha: 0.5,
} as const;
