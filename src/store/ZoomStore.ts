import { scaleToZoom } from '@/common/util';
import { defineStore } from 'pinia';

export const useZoomStore = defineStore('zoom', {
    state: () => ({
        scaleValue: 1,
    }),

    getters: {
        zoomValue: (state) => scaleToZoom(state.scaleValue),
    },
});
