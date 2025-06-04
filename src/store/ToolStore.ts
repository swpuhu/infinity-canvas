import { defineStore } from 'pinia';

// Define tool types
export enum ToolType {
    NONE = 'none',
    SELECT = 'select',
    SHAPE = 'shape',
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
        currentTool: ToolType.NONE,
        // Current selected shape type
        currentShape: 'rectangle' as string,
    }),

    getters: {
        // Get current tool
        getCurrentTool(): ToolType {
            return this.currentTool;
        },

        // Get current shape type
        getCurrentShape(): string {
            return this.currentShape;
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

        // Set current shape type
        setShape(shape: string) {
            this.currentShape = shape;
        },

        // Reset to default select tool
        resetToDefault() {
            this.currentTool = ToolType.SELECT;
            this.currentShape = 'rectangle';
        },
    },
});
