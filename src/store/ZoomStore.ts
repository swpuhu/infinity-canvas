import { defineStore } from 'pinia';

export const useZoomStore = defineStore('zoom', {
    state: () => ({
        zoomLevel: 100, // Default zoom level is 100%
        minZoom: 50, // Minimum zoom level
        maxZoom: 200, // Maximum zoom level
    }),

    actions: {
        setZoom(level: number) {
            this.zoomLevel = Math.max(
                this.minZoom,
                Math.min(level, this.maxZoom)
            );
        },

        zoomIn() {
            this.zoomLevel = Math.min(this.zoomLevel + 10, this.maxZoom);
        },

        zoomOut() {
            this.zoomLevel = Math.max(this.zoomLevel - 10, this.minZoom);
        },

        resetZoom() {
            this.zoomLevel = 100;
        },
    },
});
