import { scaleToZoom } from '@/common/util';
import { defineStore } from 'pinia';

export const useZoomStore = defineStore('zoom', {
    state: () => ({
        canvasScale: 1,
        zoomScale: 1,
    }),
});
