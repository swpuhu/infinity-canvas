import { SNodeConfig } from '@/common/types';
import { defineStore } from 'pinia';

// Define editor mode types
export enum EditorMode {
    DEFAULT = 'default',
    HAND_TOOL = 'hand_tool',
    TEXT_EDIT = 'text_edit',
    TEXT_INSERT = 'text_insert',
    SHAPE_INSERT = 'shape_insert',
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
    },

    actions: {
        // Set the current editor mode
        setMode(mode: EditorMode) {
            this.currentMode = mode;
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
            } else if (this.currentMode === EditorMode.SHAPE_INSERT) {
                this.currentMode = EditorMode.DEFAULT;
            }
        },

        setTextInsertMode(active: boolean) {
            if (active) {
                this.currentMode = EditorMode.TEXT_INSERT;
            } else if (this.currentMode === EditorMode.TEXT_INSERT) {
                this.currentMode = EditorMode.DEFAULT;
            }
            this.isHandToolActive = false;
        },

        // Reset to default mode
        resetToDefault() {
            this.currentMode = EditorMode.DEFAULT;
            this.isHandToolActive = false;
            this.currentInsertShape = SNodeConfig.NodeType.RECT;
        },
    },
});
