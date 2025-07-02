import eventBus from '@/common/eventBus';
import { WhiteboardScene } from '../WhiteboardScene';
import { useNodeInfoStore } from '@/store/NodeInfoStore';
import { VueCompConsts } from '@/common/const';
import SNode from '../SNode';

interface LayerOperationData {
    allNodes: SNode[];
    indices: number[];
}

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

    /**
     * 获取当前选中节点的操作数据
     */
    private getOperationData(): LayerOperationData | null {
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

        if (indices.length === 0) return null;

        indices.sort((a, b) => a - b);

        return { allNodes, indices };
    }

    /**
     * 交换数组中两个位置的元素
     */
    private swapElements(arr: SNode[], index1: number, index2: number): void {
        const temp = arr[index1];
        arr[index1] = arr[index2];
        arr[index2] = temp;
    }

    /**
     * 上移一层
     */
    public bringNodeToForward(): void {
        const data = this.getOperationData();
        if (!data) return;

        const { allNodes, indices } = data;

        // 从后往前遍历，依次将节点往后移动一个位置
        for (let i = indices.length - 1; i >= 0; i--) {
            const currentIndex = indices[i];
            const nextIndex = currentIndex + 1;

            // 如果nextIndex在indices中或已经在最后面，则不移动
            if (
                indices.indexOf(nextIndex) !== -1 ||
                nextIndex >= allNodes.length
            ) {
                continue;
            }

            this.swapElements(allNodes, currentIndex, nextIndex);
        }
    }

    /**
     * 下移一层
     */
    public sendNodeToBackward(): void {
        const data = this.getOperationData();
        if (!data) return;

        const { allNodes, indices } = data;

        // 从前往后遍历，依次将节点往前移动一个位置
        for (let i = 0; i < indices.length; i++) {
            const currentIndex = indices[i];
            const prevIndex = currentIndex - 1;

            // 如果prevIndex在indices中或已经在最前面，则不移动
            if (indices.indexOf(prevIndex) !== -1 || prevIndex < 0) {
                continue;
            }

            this.swapElements(allNodes, currentIndex, prevIndex);
        }
    }

    /**
     * 置于顶层
     */
    public bringNodeToFront(): void {
        const data = this.getOperationData();
        if (!data) return;

        const { allNodes, indices } = data;

        // 计算最后一个选中节点距离数组末尾的距离
        const lastIndex = indices[indices.length - 1];
        const distance = allNodes.length - 1 - lastIndex;

        // 从后往前遍历，依次将节点移动到顶层
        for (let i = indices.length - 1; i >= 0; i--) {
            const currentIndex = indices[i];
            const targetIndex = currentIndex + distance;

            // 如果目标位置在indices中或超出范围，则不移动
            if (
                indices.indexOf(targetIndex) !== -1 ||
                targetIndex >= allNodes.length
            ) {
                continue;
            }

            this.swapElements(allNodes, currentIndex, targetIndex);
        }
    }

    /**
     * 置于底层
     */
    public sendNodeToBack(): void {
        const data = this.getOperationData();
        if (!data) return;

        const { allNodes, indices } = data;

        // 计算第一个选中节点距离数组开头的距离
        const firstIndex = indices[0];
        const distance = firstIndex - 0;

        // 从前往后遍历，依次将节点移动到底层
        for (let i = 0; i < indices.length; i++) {
            const currentIndex = indices[i];
            const targetIndex = currentIndex - distance;

            // 如果目标位置在indices中或超出范围，则不移动
            if (indices.indexOf(targetIndex) !== -1 || targetIndex < 0) {
                continue;
            }

            this.swapElements(allNodes, currentIndex, targetIndex);
        }
    }
}
