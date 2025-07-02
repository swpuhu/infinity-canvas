import eventBus from '@/common/eventBus';
import { WhiteboardScene } from '../WhiteboardScene';
import { useNodeInfoStore } from '@/store/NodeInfoStore';
import { VueCompConsts } from '@/common/const';

export class LayerController {
    private _nodeInfoStore = useNodeInfoStore();
    constructor(private _scene: WhiteboardScene) {
        eventBus.onModifyNodeLayer((method) => {
            switch (method) {
                case VueCompConsts.ContextMenuKeys.BRING_FORWARD:
                    this.bringNodeToForward();
                    break;
                case VueCompConsts.ContextMenuKeys.SEND_BACKWARD:
                    this.sendNodeToBackward();
                    break;
                case VueCompConsts.ContextMenuKeys.BRING_TO_FRONT:
                    this.bringNodeToFront();
                    break;
                case VueCompConsts.ContextMenuKeys.SEND_TO_BACK:
                    this.sendNodeToBack();
                    break;
            }
        });
    }

    public bringNodeToForward() {
        // TODO: 上移一层
        const currentSelectedNodeIds =
            this._nodeInfoStore.currentSelectedNodeIds;
        const canvasNode = this._scene.getCanvasNode();
        const allNodes = this._scene.getAllNodes();
        const nodes = currentSelectedNodeIds
            .map((id) => canvasNode!.getNodeByUUID(id))
            .filter((item) => !!item);
        const indices = nodes
            .map((node) => allNodes.indexOf(node))
            .filter((index) => index !== -1);
        if (indices.length === 0) return;
        indices.sort((a, b) => a - b);

        // 从后往前遍历,依次将节点往后移动一个位置
        for (let i = indices.length - 1; i >= 0; i--) {
            const currentIndex = indices[i];
            const nextIndex = currentIndex + 1;
            // 如果nextIndex 在 indices 中, 则不移动
            if (indices.includes(nextIndex)) continue;
            // 如果已经在最后面了就不动
            if (nextIndex >= allNodes.length) continue;
            // 交换当前节点和后一个节点的位置
            const temp = allNodes[currentIndex];
            allNodes[currentIndex] = allNodes[currentIndex + 1];
            allNodes[currentIndex + 1] = temp;
        }
    }

    public sendNodeToBackward() {
        // TODO: 下移一层
        const currentSelectedNodeIds =
            this._nodeInfoStore.currentSelectedNodeIds;
        const canvasNode = this._scene.getCanvasNode();
        const allNodes = this._scene.getAllNodes();
        const nodes = currentSelectedNodeIds
            .map((id) => canvasNode!.getNodeByUUID(id))
            .filter((item) => !!item);
        const indices = nodes
            .map((node) => allNodes.indexOf(node))
            .filter((index) => index !== -1);
        if (indices.length === 0) return;
        indices.sort((a, b) => a - b);

        // 从前往后遍历,依次将节点往前移动一个位置
        for (let i = 0; i < indices.length; i++) {
            const currentIndex = indices[i];
            const prevIndex = currentIndex - 1;
            // 如果prevIndex 在 indices 中, 则不移动
            if (indices.includes(prevIndex)) continue;
            // 如果已经在最前面了就不动
            if (prevIndex < 0) continue;
            // 交换当前节点和前一个节点的位置
            const temp = allNodes[currentIndex];
            allNodes[currentIndex] = allNodes[prevIndex];
            allNodes[prevIndex] = temp;
        }
    }

    public bringNodeToFront() {
        // TODO: 置于顶层
        const currentSelectedNodeIds =
            this._nodeInfoStore.currentSelectedNodeIds;
        const canvasNode = this._scene.getCanvasNode();
        const allNodes = this._scene.getAllNodes();
        const nodes = currentSelectedNodeIds
            .map((id) => canvasNode!.getNodeByUUID(id))
            .filter((item) => !!item);
        const indices = nodes
            .map((node) => allNodes.indexOf(node))
            .filter((index) => index !== -1);
        if (indices.length === 0) return;
        indices.sort((a, b) => a - b);

        /**
         * 先计算indices中最后面的那个索引距离最后节点的距离N，
         * 然后从后往前遍历，依次将节点往前移动 N 个位置
         */
        const lastIndex = indices[indices.length - 1];
        const lastNodeIndex = allNodes.length - 1;
        const distance = lastNodeIndex - lastIndex;
        for (let i = indices.length - 1; i >= 0; i--) {
            const currentIndex = indices[i];
            const nextIndex = currentIndex + distance;
            // 如果nextIndex 在 indices 中, 则不移动
            if (indices.includes(nextIndex)) continue;
            // 如果已经在最前面了就不动
            if (nextIndex >= allNodes.length) continue;
            // 交换当前节点和后一个节点的位置
            const temp = allNodes[currentIndex];
            allNodes[currentIndex] = allNodes[nextIndex];
            allNodes[nextIndex] = temp;
        }
    }

    public sendNodeToBack() {
        // TODO: 置于底层
        const currentSelectedNodeIds =
            this._nodeInfoStore.currentSelectedNodeIds;
        const canvasNode = this._scene.getCanvasNode();
        const allNodes = this._scene.getAllNodes();
        const nodes = currentSelectedNodeIds
            .map((id) => canvasNode!.getNodeByUUID(id))
            .filter((item) => !!item);
        const indices = nodes
            .map((node) => allNodes.indexOf(node))
            .filter((index) => index !== -1);
        if (indices.length === 0) return;
        indices.sort((a, b) => a - b);

        /**
         * 先计算indices中第一个索引距离第一个节点的距离N，
         * 然后从前往后遍历，依次将节点往后移动 N 个位置
         */
        const firstIndex = indices[0];
        const firstNodeIndex = 0;
        const distance = firstIndex - firstNodeIndex;
        for (let i = 0; i < indices.length; i++) {
            const currentIndex = indices[i];
            const prevIndex = currentIndex - distance;
            // 如果prevIndex 在 indices 中, 则不移动
            if (indices.includes(prevIndex)) continue;
            // 如果已经在最后面了就不动
            if (prevIndex < 0) continue;
            // 交换当前节点和前一个节点的位置
            const temp = allNodes[currentIndex];
            allNodes[currentIndex] = allNodes[prevIndex];
            allNodes[prevIndex] = temp;
        }
    }
}
