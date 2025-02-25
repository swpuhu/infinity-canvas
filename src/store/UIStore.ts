import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('uiStore', () => {
    const willAddText = ref(false);
    return {
        willAddText,
        setWillAddText(value: boolean) {
            willAddText.value = value;
        },
    };
});
