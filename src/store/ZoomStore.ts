import { scaleToZoom, zoomToScale } from '@/common/util';
import { defineStore } from 'pinia';

const MAX_ZOOM_VALUE = 1.5;
const MIN_ZOOM_VALUE = -4.5;

export const useZoomStore = defineStore('zoom', {
    state: () => ({
        canvasScale: 1,
        zoomScale: 1,
    }),

    getters: {
        zoomValue: (state) => scaleToZoom(state.canvasScale * state.zoomScale),
        scaleValue: (state) => state.canvasScale * state.zoomScale,
    },

    actions: {
        setZoomValue(value: number) {
            if (value > MAX_ZOOM_VALUE) {
                value = MAX_ZOOM_VALUE;
            } else if (value < MIN_ZOOM_VALUE) {
                value = MIN_ZOOM_VALUE;
            }
            const scale = zoomToScale(value);
            this.zoomScale = scale / this.canvasScale;
        },
    },
});
