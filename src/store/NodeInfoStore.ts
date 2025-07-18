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

    const groupedNodeGroups = ref<{ groupId: string; nodeIds: string[] }[]>([]);

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

    const setGroupedNodeGroup = (
        group: string[],
        grouped: boolean,
        groupId?: string
    ) => {
        /**
         * 如果grouped为true，则将group中的节点 uuid加入到 groupedNodeGroups中
         * 如果grouped为false，则将group中的节点 uuid从 groupedNodeGroups中删除
         * 如果group为空，则什么都不做
         */

        // 如果group为空，则什么都不做
        if (group.length === 0) {
            return;
        }

        if (grouped) {
            // 如果要成组，需要一个groupId
            const finalGroupId =
                groupId ||
                `group_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;

            // 检查是否已经存在相同的组
            const existingGroupIndex = groupedNodeGroups.value.findIndex(
                (existingGroup) => arraysEqual(existingGroup.nodeIds, group)
            );

            if (existingGroupIndex === -1) {
                // 先移除这些节点可能存在的其他组关系
                removeNodesFromGroups(group);
                // 添加新组
                groupedNodeGroups.value.push({
                    groupId: finalGroupId,
                    nodeIds: [...group],
                });
            }
        } else {
            // 如果要解组，移除包含这些节点的组
            removeNodesFromGroups(group);
        }
    };

    const removeNodesFromGroups = (nodeIds: string[]) => {
        /**
         * 从所有组中移除指定的节点
         */
        groupedNodeGroups.value = groupedNodeGroups.value.filter((group) => {
            // 如果组中的任何节点在要移除的节点列表中，则移除整个组
            return !group.nodeIds.some((nodeId) => nodeIds.includes(nodeId));
        });
    };

    const getNodeGroupInfo = (
        nodeId: string
    ): { groupId: string; nodeIds: string[] } | null => {
        /**
         * 获取节点所在的组信息
         */
        const group = groupedNodeGroups.value.find((group) =>
            group.nodeIds.includes(nodeId)
        );
        return group || null;
    };

    const isNodeGrouped = (nodeId: string): boolean => {
        /**
         * 检查节点是否在某个组中
         */
        return getNodeGroupInfo(nodeId) !== null;
    };

    const getGroupByNodeId = (nodeId: string): string[] => {
        /**
         * 根据节点ID获取整个组的节点ID列表
         */
        const groupInfo = getNodeGroupInfo(nodeId);
        return groupInfo ? groupInfo.nodeIds : [nodeId];
    };

    const isGrouped = (nodeIds: string[]): boolean => {
        /**
         * 检查选中的节点是否都在同一个组中
         */
        if (nodeIds.length === 0) return false;

        const firstNodeGroupInfo = getNodeGroupInfo(nodeIds[0]);
        if (!firstNodeGroupInfo) return false;

        // 检查所有选中的节点是否都在同一个组中
        return nodeIds.every((nodeId) => {
            const groupInfo = getNodeGroupInfo(nodeId);
            return (
                groupInfo && groupInfo.groupId === firstNodeGroupInfo.groupId
            );
        });
    };

    const ungroupNodes = (nodeIds: string[]) => {
        /**
         * 解组指定的节点
         */
        if (nodeIds.length === 0) return;

        const firstNodeGroupInfo = getNodeGroupInfo(nodeIds[0]);
        if (firstNodeGroupInfo) {
            setGroupedNodeGroup(firstNodeGroupInfo.nodeIds, false);
        }
    };

    const editGroup = (nodeIds: string[]) => {
        /**
         * 编辑组（目前只是一个占位方法，可以后续扩展）
         */
        console.log('编辑组功能待实现', nodeIds);
    };

    const groupNodes = (nodeIds: string[]) => {
        /**
         * 将多个节点成组
         */
        if (nodeIds.length < 2) {
            console.warn('至少需要2个节点才能成组');
            return;
        }

        setGroupedNodeGroup(nodeIds, true);
    };

    return {
        currentSelectedNodeIds,
        setCurrentSelectedNodeIds,
        lockedNodeGroup,
        setLockedNodeGroup,
        groupedNodeGroups,
        setGroupedNodeGroup,
        removeNodesFromGroups,
        getNodeGroupInfo,
        isNodeGrouped,
        getGroupByNodeId,
        isGrouped,
        ungroupNodes,
        editGroup,
        groupNodes,
    };
});
