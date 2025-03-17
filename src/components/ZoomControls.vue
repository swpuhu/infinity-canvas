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

            <!-- Hand tool (UI only) -->
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

            <!-- Zoom level display -->
            <div class="zoom-level">{{ displayZoomPercentage }}%</div>

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
import { computed, defineEmits, ref } from 'vue';

const emit = defineEmits(['zoom-change', 'zoom-value-change']);
const zoomValue = ref(0); // Default zoom value is 0 (100% scale)
const zoomStep = 0.25; // Step size for zoom in/out operations

// Computed property to display zoom percentage
const displayZoomPercentage = computed(() => {
    return Math.round(Math.exp(zoomValue.value) * 100);
});

// Zoom in by one step
function zoomIn() {
    zoomValue.value = Math.min(zoomValue.value + zoomStep, 3);
    emit('zoom-value-change', zoomValue.value);
}

// Zoom out by one step
function zoomOut() {
    zoomValue.value = Math.max(zoomValue.value - zoomStep, -3);
    emit('zoom-value-change', zoomValue.value);
}

// Reset zoom to 100% (zoom value = 0)
function resetZoom() {
    zoomValue.value = 0;
    emit('zoom-value-change', zoomValue.value);
}

// Method to be called from parent to update zoom value
function setZoomValue(value: number) {
    zoomValue.value = Math.max(-3, Math.min(value, 3));
}

// Method to be called from parent to update zoom percentage
function setZoomPercentage(percentage: number) {
    // Convert percentage to zoom value using natural logarithm
    zoomValue.value = Math.log(percentage / 100);
}

// Expose methods to parent component
defineExpose({
    setZoomValue,
    setZoomPercentage,
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

.zoom-level {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        Helvetica, Arial, sans-serif;
    font-size: 14px;
    padding: 0 12px;
    min-width: 60px;
    text-align: center;
    color: #333;
}
</style>
