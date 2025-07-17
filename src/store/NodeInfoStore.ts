import { arraysEqual } from '@/common/util';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNodeInfoStore = defineStore('nodeInfo', () => {
    const currentSelectedNodeIds = ref<string[]>([]);

    const setCurrentSelectedNodeIds = (nodeIds: string[]) => {
        currentSelectedNodeIds.value = nodeIds;
        // console.log('currentSelectedNodeIds', currentSelectedNodeIds.value);
    };

    const lockedNodeGroup = ref<string[][]>([]);

    const setLockedNodeGroup = (group: string[], locked: boolean) => {
        /**
         * 如果locked为true，则将group中的节点 uuid加入到 lockedNodeGroup中
         * 如果locked为false，则将group中的节点 uuid从 lockedNodeGroup中删除，注意group的string[] 需要与 lockedNodeGroup中的string[] 进行对比
         * 对比的方式是只要 group 只要在 lockedNodeGroup 中存在，则删除，
         * 例如 group 为 ['1', '2']，lockedNodeGroup 为 [['2', '1'], ['3', '4']]，则删除 ['1', '2']
         * 如果 group 为 ['1', '2']，lockedNodeGroup 为 [['2', '1', 3], ['4']]，则不进行任何操作
         * 如果group为空，则什么都不做
         * 如果lockedNodeGroup中包含group中的节点，则不进行任何操作
         */

        // 如果group为空，则什么都不做
        if (group.length === 0) {
            return;
        }

        // 检查lockedNodeGroup中是否已经存在相同的组
        const existingGroupIndex = lockedNodeGroup.value.findIndex(
            (lockedGroup) => arraysEqual(lockedGroup, group)
        );

        if (locked) {
            // 如果要锁定，且lockedNodeGroup中还不存在这个组，则添加
            if (existingGroupIndex === -1) {
                lockedNodeGroup.value.push([...group]);
            }
            // 如果已经存在，则不进行任何操作
        } else {
            // 如果要解锁，且找到了匹配的组，则删除
            if (existingGroupIndex !== -1) {
                lockedNodeGroup.value.splice(existingGroupIndex, 1);
            }
            // 如果没找到匹配的组，则不进行任何操作
        }
    };

    return {
        currentSelectedNodeIds,
        setCurrentSelectedNodeIds,
        lockedNodeGroup,
        setLockedNodeGroup,
    };
});
