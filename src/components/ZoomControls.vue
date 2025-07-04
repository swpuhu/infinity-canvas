<template>
    <div class="zoom-controls">
        <div class="zoom-control-container">
            <!-- Undo button (UI only) -->
            <button class="control-button" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 14L4 9l5-5" />
                    <path d="M4 9h16c1.5 0 3 1.5 3 3s-1.5 3-3 3h-7" />
                </svg>
            </button>

            <!-- Redo button (UI only) -->
            <button class="control-button" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 14l5-5-5-5" />
                    <path d="M20 9H4c-1.5 0-3 1.5-3 3s1.5 3 3 3h7" />
                </svg>
            </button>

            <!-- Hand tool -->
            <button class="control-button" :class="{ active: isHandToolActive }" @click="toggleHandTool">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                    <path
                        d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
            </button>

            <!-- Zoom out button -->
            <button class="control-button" @click="zoomOut">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>

            <!-- Zoom level input -->
            <div class="zoom-level-input-container">
                <input type="text" class="zoom-level-input" v-model="zoomPercentageProxy" @blur="handleZoomInputBlur"
                    @keyup.enter="handleZoomInputBlur" />
                <span class="zoom-level-suffix">%</span>
            </div>

            <!-- Zoom in button -->
            <button class="control-button" @click="zoomIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>

            <!-- Reset zoom button -->
            <button class="control-button" @click="resetZoom">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">

import { computed, defineEmits, onMounted, onUnmounted, ref } from 'vue';
import { EditorMode, useEditorModeStore } from '../store/EditorModeStore';
import { useZoomStore } from '@/store/ZoomStore';
import { vec2 } from 'gl-matrix';
import eventBus from '@/common/eventBus';
import { isCtrlKey } from '@/common/util';

const emit = defineEmits([
    'zoom-change',
    'zoom-value-change',
    'hand-tool-change',
    'canvas-drag',
    'canvas-drag-start',
]);

// Get the editor mode store
const editorModeStore = useEditorModeStore();
const zoomStore = useZoomStore();

// 代理 zoomStore.scaleValue，读取时乘以100，写入时除以100
const zoomPercentageProxy = computed({
    get: () => Math.round(zoomStore.canvasScale * zoomStore.zoomScale * 100),
    set: (value: number | string) => {
        const numValue = typeof value === 'string' ? parseInt(value) : value;

        // 验证输入
        if (isNaN(numValue) || numValue <= 0) {
            return; // 忽略无效输入
        }

        // 边界限制 (10% - 500%)
        const minPercentage = 10;
        const maxPercentage = 500;
        const clampedValue = Math.max(minPercentage, Math.min(numValue, maxPercentage));

        // 转换为 0-1 的小数并设置到 store
        zoomStore.zoomScale = clampedValue / zoomStore.canvasScale / 100;
    }
});

// Hand tool state
const isSpaceKeyPressed = ref(false);
let isDragging = false;  // 改为普通变量

// Computed property for hand tool active state from the store
const isHandToolActive = computed(() => editorModeStore.currentMode === EditorMode.HAND_TOOL);


// Toggle hand tool mode
function toggleHandTool() {
    const currentMode = editorModeStore.currentMode;
    if (currentMode === EditorMode.HAND_TOOL) {
        editorModeStore.setMode(EditorMode.DEFAULT);
    } else {
        editorModeStore.setMode(EditorMode.HAND_TOOL);
    }
}

// Handle space key press
function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space' && !event.repeat && !isSpaceKeyPressed.value) {
        isSpaceKeyPressed.value = true;
        const currentEditMode = editorModeStore.currentMode;
        if (currentEditMode === EditorMode.DEFAULT) {
            editorModeStore.setMode(EditorMode.HAND_TOOL);
            return;
        }
        // Prevent default space behavior (like scrolling the page)
        event.preventDefault();
    }
}

// Handle space key release
function handleKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space' && isSpaceKeyPressed.value) {
        isSpaceKeyPressed.value = false;
        const currentEditMode = editorModeStore.currentMode;
        if (currentEditMode === EditorMode.HAND_TOOL) {
            editorModeStore.setMode(EditorMode.DEFAULT);
        }
    }
}

let startPos = vec2.fromValues(0, 0);
// Handle mouse down in hand tool mode
function handleMouseDown(event: PointerEvent) {
    const currentMode = editorModeStore.currentMode;
    if (currentMode === EditorMode.HAND_TOOL) {
        isDragging = true;
        event.preventDefault();
        vec2.set(startPos, event.offsetX, event.offsetY);
        eventBus.panCanvasStart();
    }
}

// Handle mouse move for canvas dragging
function handleMouseMove(event: PointerEvent) {
    if (isDragging) {
        event.preventDefault();

        eventBus.panCanvas(event.offsetX, event.offsetY, startPos[0], startPos[1]);
    }
}

// Handle mouse up to end dragging
function handleMouseUp(event: PointerEvent) {
    if (isDragging) {
        isDragging = false;
    }
}


function handleWheel(event: WheelEvent) {
    if (isCtrlKey(event)) {
        event.preventDefault();

        console.log(event.offsetX, event.offsetY, event.deltaY);
        eventBus.zoomCanvas(event.offsetX, event.offsetY, event.deltaY);
    }
}

// Set up event listeners on component mount
onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handleMouseDown);
    window.addEventListener('pointermove', handleMouseMove);
    window.addEventListener('pointerup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    // Also handle case when mouse leaves the window
});

// Clean up event listeners on component unmount
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('pointerdown', handleMouseDown);
    window.removeEventListener('pointermove', handleMouseMove);
    window.removeEventListener('pointerup', handleMouseUp);
    window.removeEventListener('wheel', handleWheel);
});

// Handle zoom input blur or enter key press
function handleZoomInputBlur() {
    // 触发重新渲染，确保显示有效值
    // 代理计算属性已经处理了验证和边界检查
}

// Zoom in by one step
function zoomIn() {

}

// Zoom out by one step
function zoomOut() {
}

// Reset zoom to 100% (zoom value = 0)
function resetZoom() {
}

// Method to be called from parent to update zoom value
function setZoomValue(value: number) {
}

// Method to be called from parent to update zoom percentage
function setZoomPercentage(percentage: number) {

}


</script>

<style scoped>
.zoom-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
}

.zoom-control-container {
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px;
}

.control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background-color: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #555;
    margin: 0 2px;
}

.control-button:hover:not(:disabled) {
    background-color: #f0f0f0;
}

.control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.control-button.active {
    background-color: #e6f7ff;
    color: #1890ff;
}

.zoom-level-input-container {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 60px;
    margin: 0 8px;
}

.zoom-level-input {
    width: 50px;
    height: 28px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 0 20px 0 8px;
    font-size: 14px;
    color: #333;
    text-align: right;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        Helvetica, Arial, sans-serif;
}

.zoom-level-input:focus {
    outline: none;
    border-color: #409eff;
}

.zoom-level-suffix {
    position: absolute;
    right: 8px;
    color: #606266;
    font-size: 14px;
    pointer-events: none;
}
</style>
