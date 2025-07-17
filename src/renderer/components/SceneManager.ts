import { SNodeConfig } from '@/common/types';
import { CanvasEditor } from '../Editor';
import SNode from '../SNode';
import presetShapes from './PresetShapes';
import eventBus from '@/common/eventBus';
import { createNodeFromConfig } from '../util';
import { getCursorStyleString } from '@/common/util';
import { useNodeInfoStore } from '@/store/NodeInfoStore';
import { watch } from 'vue';

export class SceneManager {
    private _presetShapes = presetShapes;
    private _nodeInfoStore = useNodeInfoStore();
    constructor(private _editor: CanvasEditor) {
        eventBus.onInsertPresetNodeIntoScene(this._onInsertPresetNodeIntoScene);
        this._bindGlobalEvent();
    }

    private _bindGlobalEvent() {
        // 专门监听 lockedNodeGroup 的变化
        watch(
            () => this._nodeInfoStore.lockedNodeGroup,
            (lockedNodeGroups) => {
                this._updateNodesLockStatus(lockedNodeGroups);
            },
            { deep: true }
        );
    }

    /**
     * 更新节点的锁定状态
     */
    private _updateNodesLockStatus(lockedNodeGroups: string[][]) {
        const allNodes = this._editor.scene.getAllNodes();

        // 先将所有锁定的 UUID 展开为 Set，提高查找效率
        const lockedUuids = new Set<string>();
        for (const lockedNodeGroup of lockedNodeGroups) {
            for (const lockedNodeUuid of lockedNodeGroup) {
                lockedUuids.add(lockedNodeUuid);
            }
        }

        // 遍历所有节点，检查是否需要锁定
        for (const node of allNodes) {
            node.isLocked = lockedUuids.has(node.uuid);
        }
    }

    private _onInsertPresetNodeIntoScene = (
        type: SNodeConfig.NodeType,
        props: any,
        replyFunc: (node: SNode) => void
    ) => {
        const nodeConfig = this._presetShapes.getPresetShapeConfig(type);
        const node = createNodeFromConfig(nodeConfig);

        replyFunc(node);
    };

    public connectNode(node1: SNode, node2: SNode) {}

    public insertPresetNodeIntoScene(
        type: SNodeConfig.NodeType,
        props: {
            position: {
                x: number;
                y: number;
            };
        }
    ): SNode {
        const canvasNode = this._editor.scene.getCanvasNode();
        const node = this._presetShapes[
            type as keyof typeof this._presetShapes
        ] as SNode;
        if (!node) {
            throw new Error(`Preset shape ${type} not found`);
        }
        node.position.set(props.position.x, props.position.y);
        canvasNode.addChild(node);

        return node;
    }
}
