import { CursorStyle, ResizeDirection, SNodeConfig } from '@/common/types';
import { defineStore } from 'pinia';

// Define editor mode types
export enum EditorMode {
    DEFAULT = 'default',
    HAND_TOOL = 'hand_tool',
    TEXT_EDIT = 'text_edit',
    TEXT_INSERT = 'text_insert',
    SHAPE_INSERT = 'shape_insert',
    PRE_RESIZE = 'pre_resize',
    PRE_ROTATE = 'pre_rotate',
    RESIZING = 'resizing',
    ROTATING = 'rotating',
    // Add more modes as needed
}

export const useEditorModeStore = defineStore('editorMode', {
    state: () => ({
        // Current editor mode
        currentMode: EditorMode.DEFAULT,
        // Flag to indicate if hand tool drag mode is active
        isHandToolActive: false,
        // Current shape being inserted
        currentInsertShape: SNodeConfig.NodeType.RECT,

        resizeDirection: 'none' as ResizeDirection,
    }),
    getters: {
        // Check if the editor is in hand tool mode
        isHandToolMode(): boolean {
            return (
                this.currentMode === EditorMode.HAND_TOOL ||
                this.isHandToolActive
            );
        },

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
                this.currentMode === EditorMode.SHAPE_INSERT
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
            }

            return CursorStyle.DEFAULT;
        },
    },

    actions: {
        // Set the current editor mode
        setMode(mode: EditorMode, direction?: ResizeDirection) {
            this.currentMode = mode;
            if (mode === EditorMode.PRE_RESIZE) {
                this.resizeDirection = direction || 'none';
            }
        },

        // Set hand tool active state
        setHandToolActive(active: boolean) {
            this.isHandToolActive = active;

            // If activating hand tool, also set the mode
            if (active) {
                this.currentMode = EditorMode.HAND_TOOL;
            } else if (this.currentMode === EditorMode.HAND_TOOL) {
                // If deactivating and current mode is hand tool, reset to default
                this.currentMode = EditorMode.DEFAULT;
            }
        },

        // Set shape insert mode
        setShapeInsertMode(active: boolean, shape?: SNodeConfig.NodeType) {
            if (active) {
                this.currentMode = EditorMode.SHAPE_INSERT;
                // Deactivate hand tool if it was active
                this.isHandToolActive = false;
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
            if (active) {
                this.isHandToolActive = false;
                this.currentMode = EditorMode.TEXT_INSERT;
            } else if (!active || this.currentMode === EditorMode.TEXT_INSERT) {
                this.currentMode = EditorMode.DEFAULT;
            }
        },

        // Reset to default mode
        resetToDefault() {
            this.currentMode = EditorMode.DEFAULT;
            this.isHandToolActive = false;
            this.currentInsertShape = SNodeConfig.NodeType.RECT;
        },
    },
});
