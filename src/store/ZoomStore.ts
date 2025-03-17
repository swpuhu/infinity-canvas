import { defineStore } from 'pinia';

export const useZoomStore = defineStore('zoom', {
    state: () => ({
        // Zoom value (can be negative)
        zoomValue: 0, // Default zoom value is 0, which corresponds to 100% scale
        minZoomValue: -2, // Minimum zoom value
        maxZoomValue: 1.5, // Maximum zoom value
        zoomStep: 0.05, // Step size for zoom in/out operations
    }),

    getters: {
        // Convert zoom value to scale using exponential function
        scale(): number {
            return Math.exp(this.zoomValue);
        },

        // Convert zoom value to percentage for display
        zoomPercentage(): number {
            return Math.round(this.scale * 100);
        },
    },

    actions: {
        // Set zoom value directly
        setZoomValue(value: number) {
            this.zoomValue = Math.max(
                this.minZoomValue,
                Math.min(value, this.maxZoomValue)
            );
            console.log('zoomValue', this.zoomValue);
        },

        // Set zoom by percentage (e.g., 100 for 100%)
        setZoomPercentage(percentage: number) {
            // Convert percentage to zoom value using natural logarithm
            const zoomValue = Math.log(percentage / 100);
            this.setZoomValue(zoomValue);
        },

        // Zoom in by one step
        zoomIn() {
            this.setZoomValue(this.zoomValue + this.zoomStep);
        },

        // Zoom out by one step
        zoomOut() {
            this.setZoomValue(this.zoomValue - this.zoomStep);
        },

        // Reset zoom to 100% (zoom value = 0)
        resetZoom() {
            this.zoomValue = 0;
        },
    },
});
