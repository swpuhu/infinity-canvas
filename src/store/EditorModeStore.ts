import { defineStore } from 'pinia';

// Define editor mode types
export enum EditorMode {
    DEFAULT = 'default',
    HAND_TOOL = 'hand_tool',
    TEXT_EDIT = 'text_edit',
    // Add more modes as needed
}

export const useEditorModeStore = defineStore('editorMode', {
    state: () => ({
        // Current editor mode
        currentMode: EditorMode.DEFAULT,
        // Flag to indicate if hand tool drag mode is active
        isHandToolActive: false,
    }),

    getters: {
        // Check if the editor is in hand tool mode
        isHandToolMode(): boolean {
            return (
                this.currentMode === EditorMode.HAND_TOOL ||
                this.isHandToolActive
            );
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

        // Reset to default mode
        resetToDefault() {
            this.currentMode = EditorMode.DEFAULT;
            this.isHandToolActive = false;
        },
    },
});
