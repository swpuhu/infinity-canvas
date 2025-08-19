import { CursorStyle, ResizeDirection, SNodeConfig } from '@/common/types';
import { defineStore } from 'pinia';

// Define editor mode types
export enum EditorMode {
    DEFAULT = 0b00000000001,
    TEXT_EDIT = 0b0000000010,
    TEXT_INSERT = 0b0000000100,
    SHAPE_INSERT = 0b0000001000,
    PRE_RESIZE = 0b0000010000 | EditorMode.DEFAULT,
    PRE_ROTATE = 0b0000100000 | EditorMode.DEFAULT,
    RESIZING = 0b0001000000,
    ROTATING = 0b0010000000,
    DRAGGING = 0b0100000000,
    HAND_TOOL = 0b1000000000,
    PRE_MOVE_ARROW = 0b10000000000 | EditorMode.DEFAULT,
    PRE_RESIZE_ARROW = 0b100000000000 | EditorMode.DEFAULT,
    ARROW_INSERT = 0b1000000000000,
    // Add more modes as needed
}

export const useEditorModeStore = defineStore('editorMode', {
    state: () => ({
        // Current editor mode
        currentMode: EditorMode.DEFAULT,
        // Current shape being inserted
        currentInsertShape: SNodeConfig.NodeType.RECT,

        resizeDirection: 'none' as ResizeDirection,
    }),
    getters: {
        // Check if the editor is in shape insert mode
        isShapeInsertMode(): boolean {
            return this.currentMode === EditorMode.SHAPE_INSERT;
        },

        isTextInsertMode(): boolean {
            return this.currentMode === EditorMode.TEXT_INSERT;
        },

        // Get current insert shape
        getCurrentInsertShape(): string {
            return this.currentInsertShape;
        },
        currentCursorStyle(): CursorStyle {
            if (
                this.currentMode === EditorMode.TEXT_INSERT ||
                this.currentMode === EditorMode.SHAPE_INSERT ||
                this.currentMode === EditorMode.ARROW_INSERT
            ) {
                return CursorStyle.INSERT;
            } else if (this.currentMode === EditorMode.TEXT_EDIT) {
                return CursorStyle.TEXT_EDIT;
            } else if (
                this.currentMode === EditorMode.PRE_RESIZE ||
                this.currentMode === EditorMode.RESIZING
            ) {
                return CursorStyle.RESIZE;
            } else if (
                this.currentMode === EditorMode.PRE_ROTATE ||
                this.currentMode === EditorMode.ROTATING
            ) {
                return CursorStyle.ROTATE;
            } else if (this.currentMode === EditorMode.HAND_TOOL) {
                return CursorStyle.HAND_TOOL;
            } else if (this.currentMode === EditorMode.PRE_MOVE_ARROW) {
                return CursorStyle.MOVE;
            } else if (this.currentMode === EditorMode.PRE_RESIZE_ARROW) {
                return CursorStyle.RESIZE;
            }

            return CursorStyle.DEFAULT;
        },
    },

    actions: {
        // Set the current editor mode
        setMode(mode: EditorMode, direction?: ResizeDirection) {
            // if (this.currentMode === mode) {
            //     debugger;
            // }
            // console.log('setMode', mode);

            this.currentMode = mode;
            if (
                mode === EditorMode.PRE_RESIZE ||
                mode === EditorMode.PRE_RESIZE_ARROW
            ) {
                this.resizeDirection = direction || 'none';
            }
        },

        // Set shape insert mode
        setShapeInsertMode(active: boolean, shape?: SNodeConfig.NodeType) {
            if (active) {
                this.currentMode = EditorMode.SHAPE_INSERT;
                // Set current insert shape if provided
                if (shape) {
                    this.currentInsertShape = shape;
                }
            } else if (
                !active ||
                this.currentMode === EditorMode.SHAPE_INSERT
            ) {
                this.currentMode = EditorMode.DEFAULT;
            }
        },

        isToolActive(tool: EditorMode): boolean {
            return this.currentMode === tool;
        },

        setTextInsertMode(active: boolean) {
            console.log('setTextInsertMode');
            if (active) {
                this.currentMode = EditorMode.TEXT_INSERT;
            } else if (!active || this.currentMode === EditorMode.TEXT_INSERT) {
                this.currentMode = EditorMode.DEFAULT;
            }
        },

        // Reset to default mode
        resetToDefault() {
            this.currentMode = EditorMode.DEFAULT;
            this.currentInsertShape = SNodeConfig.NodeType.RECT;
        },
    },
});
