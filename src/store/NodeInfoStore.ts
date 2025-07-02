import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNodeInfoStore = defineStore('nodeInfo', () => {
    const currentSelectedNodeIds = ref<string[]>([]);

    const setCurrentSelectedNodeIds = (nodeIds: string[]) => {
        currentSelectedNodeIds.value = nodeIds;
        console.log('currentSelectedNodeIds', currentSelectedNodeIds.value);
    };

    return {
        currentSelectedNodeIds,
        setCurrentSelectedNodeIds,
    };
});
