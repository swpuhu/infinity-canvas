<template>
    <div class="vertical-toolbar">
        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.SELECT) }"
            @click="setActiveTool(ToolType.SELECT)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.TEXT) }"
            @click="setActiveTool(ToolType.TEXT)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <text
                    x="6"
                    y="16"
                    font-family="sans-serif"
                    font-size="14"
                    font-weight="bold"
                >
                    T
                </text>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.COMMENT) }"
            @click="setActiveTool(ToolType.COMMENT)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                ></path>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.HAND) }"
            @click="setActiveTool(ToolType.HAND)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
                <path
                    d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
                ></path>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.IMAGE) }"
            @click="setActiveTool(ToolType.IMAGE)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.GRID) }"
            @click="setActiveTool(ToolType.GRID)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.PEN) }"
            @click="setActiveTool(ToolType.PEN)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.SETTINGS) }"
            @click="setActiveTool(ToolType.SETTINGS)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <line x1="4" y1="9" x2="20" y2="9"></line>
                <line x1="4" y1="15" x2="20" y2="15"></line>
                <line x1="10" y1="3" x2="8" y2="21"></line>
                <line x1="16" y1="3" x2="14" y2="21"></line>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.SEARCH) }"
            @click="setActiveTool(ToolType.SEARCH)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </div>

        <div
            class="toolbar-item"
            :class="{ active: toolStore.isToolActive(ToolType.MENU) }"
            @click="setActiveTool(ToolType.MENU)"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useEditorModeStore } from '../store/EditorModeStore';
import { ToolType, useToolStore } from '../store/ToolStore';

const emit = defineEmits(['tool-selected']);
const editorModeStore = useEditorModeStore();
const toolStore = useToolStore();

// Set active tool and emit event
function setActiveTool(tool: ToolType) {
    // Update the tool store
    toolStore.setTool(tool);

    // Emit tool selection event
    emit('tool-selected', tool);

    // Handle special tool cases
    if (tool === ToolType.HAND) {
        editorModeStore.setHandToolActive(true);
    } else if (editorModeStore.isHandToolActive) {
        editorModeStore.setHandToolActive(false);
    }
}

// Initialize component
onMounted(() => {
    // Set initial tool
    toolStore.setTool(ToolType.SELECT);
});

// Expose method to activate a tool programmatically
defineExpose({
    setActiveTool,
});
</script>

<style scoped>
.vertical-toolbar {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px;
    z-index: 100;
}

.toolbar-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    cursor: pointer;
    color: #555;
    margin: 4px 0;
    transition: all 0.2s ease;
}

.toolbar-item:hover {
    background-color: #f0f0f0;
}

.toolbar-item.active {
    background-color: #e6f7ff;
    color: #1890ff;
}
</style>
