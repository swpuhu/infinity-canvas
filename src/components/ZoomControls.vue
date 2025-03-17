<template>
    <div class="zoom-controls">
        <div class="zoom-control-container">
            <!-- Undo button (UI only) -->
            <button class="control-button" disabled>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M9 14L4 9l5-5" />
                    <path d="M4 9h16c1.5 0 3 1.5 3 3s-1.5 3-3 3h-7" />
                </svg>
            </button>

            <!-- Redo button (UI only) -->
            <button class="control-button" disabled>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M15 14l5-5-5-5" />
                    <path d="M20 9H4c-1.5 0-3 1.5-3 3s1.5 3 3 3h7" />
                </svg>
            </button>

            <!-- Hand tool -->
            <button
                class="control-button"
                :class="{ active: isHandToolActive }"
                @click="toggleHandTool"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                    <path
                        d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
                    />
                </svg>
            </button>

            <!-- Zoom out button -->
            <button class="control-button" @click="zoomOut">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>

            <!-- Zoom level input -->
            <div class="zoom-level-input-container">
                <input
                    type="text"
                    class="zoom-level-input"
                    v-model="inputZoomPercentage"
                    @blur="handleZoomInputBlur"
                    @keyup.enter="handleZoomInputBlur"
                />
                <span class="zoom-level-suffix">%</span>
            </div>

            <!-- Zoom in button -->
            <button class="control-button" @click="zoomIn">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>

            <!-- Reset zoom button -->
            <button class="control-button" @click="resetZoom">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                    />
                    <path d="M3 3v5h5" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Vec2 } from '@/common/Vec2';
import { computed, defineEmits, onMounted, onUnmounted, ref, watch } from 'vue';
import { useEditorModeStore } from '../store/EditorModeStore';

const emit = defineEmits([
    'zoom-change',
    'zoom-value-change',
    'hand-tool-change',
    'canvas-drag',
    'canvas-drag-start',
]);
const zoomValue = ref(0); // Default zoom value is 0 (100% scale)
const zoomStep = 0.05; // Step size for zoom in/out operations, matching ZoomStore

// Get the editor mode store
const editorModeStore = useEditorModeStore();

// Hand tool state
const isSpaceKeyPressed = ref(false);
const isDragging = ref(false);
const startPos = new Vec2(0);
const dragPos = new Vec2(0);

// Computed property for hand tool active state from the store
const isHandToolActive = computed(() => editorModeStore.isHandToolActive);

// Computed property to check if hand tool mode is active (either by button click or space key)
const isHandToolMode = computed(() => {
    return isHandToolActive.value || isSpaceKeyPressed.value;
});

// Computed property to display zoom percentage
const displayZoomPercentage = computed(() => {
    return Math.round(Math.exp(zoomValue.value) * 100);
});

// Input field for zoom percentage
const inputZoomPercentage = ref('100');

// Watch for changes in the zoom value to update the input field
watch(displayZoomPercentage, (newPercentage) => {
    inputZoomPercentage.value = newPercentage.toString();
});

// Toggle hand tool mode
function toggleHandTool() {
    const newState = !editorModeStore.isHandToolActive;
    editorModeStore.setHandToolActive(newState);
    emit('hand-tool-change', newState);
}

// Handle space key press
function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space' && !event.repeat && !isSpaceKeyPressed.value) {
        isSpaceKeyPressed.value = true;

        // Update cursor immediately
        updateCursor();

        emit('hand-tool-change', true);
        // Prevent default space behavior (like scrolling the page)
        event.preventDefault();
    }
}

// Handle space key release
function handleKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space' && isSpaceKeyPressed.value) {
        isSpaceKeyPressed.value = false;

        // If we're currently dragging, end the drag operation
        if (isDragging.value) {
            isDragging.value = false;
        }

        // Update cursor based on current state

        // Only emit hand-tool-change event if the hand tool isn't active from button click

        emit('hand-tool-change', false);
        updateCursor();
    }
}

// Handle mouse down in hand tool mode
function handleMouseDown(event: MouseEvent) {
    if (isHandToolMode.value) {
        isDragging.value = true;
        startPos.set(event.offsetX, event.offsetY);
        console.log('startPos', startPos);
        document.body.style.cursor = 'grabbing';
        event.preventDefault();
        emit('canvas-drag-start', { x: startPos.x, y: startPos.y });
    }
}

// Handle mouse move for canvas dragging
function handleMouseMove(event: MouseEvent) {
    if (isDragging.value) {
        const offsetX = event.offsetX;
        const offsetY = event.offsetY;
        const deltaX = offsetX - startPos.x;
        const deltaY = offsetY - startPos.y;
        console.log(deltaX, deltaY);
        emit('canvas-drag', { deltaX, deltaY });

        event.preventDefault();
    }
}

// Handle mouse up to end dragging
function handleMouseUp() {
    if (isDragging.value) {
        isDragging.value = false;
        document.body.style.cursor = isHandToolMode.value ? 'grab' : 'default';
    }
}

// Update cursor based on hand tool mode
function updateCursor() {
    document.body.style.cursor = isHandToolMode.value ? 'grab' : 'default';
}

// Watch for changes in hand tool mode to update cursor
watch(isHandToolMode, (newValue) => {
    updateCursor();
});

// Set up event listeners on component mount
onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    // Also handle case when mouse leaves the window
    window.addEventListener('mouseleave', handleMouseUp);
});

// Clean up event listeners on component unmount
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('mouseleave', handleMouseUp);
    // Reset cursor
    document.body.style.cursor = 'default';
});

// Handle zoom input blur or enter key press
function handleZoomInputBlur() {
    let percentage = parseInt(inputZoomPercentage.value);

    // Validate input
    if (isNaN(percentage) || percentage <= 0) {
        // Reset to current zoom if invalid
        inputZoomPercentage.value = displayZoomPercentage.value.toString();
        return;
    }

    // Calculate min and max percentages based on zoom value limits
    const minPercentage = Math.round(Math.exp(-2) * 100); // ~13.5%
    const maxPercentage = Math.round(Math.exp(1.5) * 100); // ~448%

    // Clamp percentage within valid range
    percentage = Math.max(minPercentage, Math.min(percentage, maxPercentage));

    // Update input field with clamped value
    inputZoomPercentage.value = percentage.toString();

    // Convert percentage to zoom value and emit change
    const newZoomValue = Math.log(percentage / 100);
    zoomValue.value = newZoomValue;
    emit('zoom-value-change', newZoomValue);
}

// Zoom in by one step
function zoomIn() {
    zoomValue.value = Math.min(zoomValue.value + zoomStep, 1.5);
    emit('zoom-value-change', zoomValue.value);
}

// Zoom out by one step
function zoomOut() {
    zoomValue.value = Math.max(zoomValue.value - zoomStep, -2);
    emit('zoom-value-change', zoomValue.value);
}

// Reset zoom to 100% (zoom value = 0)
function resetZoom() {
    zoomValue.value = 0;
    emit('zoom-value-change', zoomValue.value);
}

// Method to be called from parent to update zoom value
function setZoomValue(value: number) {
    zoomValue.value = Math.max(-2, Math.min(value, 1.5));
}

// Method to be called from parent to update zoom percentage
function setZoomPercentage(percentage: number) {
    // Convert percentage to zoom value using natural logarithm
    zoomValue.value = Math.log(percentage / 100);
    inputZoomPercentage.value = percentage.toString();
}

// Method to be called from parent to set hand tool state
function setHandToolActive(active: boolean) {
    editorModeStore.setHandToolActive(active);
    updateCursor();
}

// Expose methods to parent component
defineExpose({
    setZoomValue,
    setZoomPercentage,
    setHandToolActive,
});
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
