import { defineStore } from 'pinia';

// Define tool types
export enum ToolType {
    SELECT = 'select',
    TEXT = 'text',
    COMMENT = 'comment',
    HAND = 'hand',
    IMAGE = 'image',
    GRID = 'grid',
    PEN = 'pen',
    SETTINGS = 'settings',
    SEARCH = 'search',
    MENU = 'menu',
}

export const useToolStore = defineStore('tool', {
    state: () => ({
        // Current active tool
        currentTool: ToolType.SELECT,
    }),

    getters: {
        // Get current tool
        getCurrentTool(): ToolType {
            return this.currentTool;
        },

        // Check if a specific tool is active
        isToolActive: (state) => (tool: ToolType) => {
            return state.currentTool === tool;
        },
    },

    actions: {
        // Set current tool
        setTool(tool: ToolType) {
            this.currentTool = tool;
        },

        // Reset to default select tool
        resetToDefault() {
            this.currentTool = ToolType.SELECT;
        },
    },
});
