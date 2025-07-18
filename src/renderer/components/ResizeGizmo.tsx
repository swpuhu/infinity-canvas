import { EventNames } from '@/common/types';
import { CanvasEditor } from '../Editor';
import SNode from '../SNode';
import { getWorldRect } from '../util';
import { WhiteboardScene } from '../WhiteboardScene';
import { EventsHandler } from './resizer/EventsHandler';
import { ResizerUI } from './resizer/ResizerUI';
import { SnapGuide } from './SnapGuide';
import { useNodeInfoStore } from '@/store/NodeInfoStore';
import { watch } from 'vue';

export class ResizeGizmo {
    private _scene: WhiteboardScene;
    private _editor: CanvasEditor;

    private _uiComponent: ResizerUI;

    private _eventsHandler: EventsHandler;

    private _nodeInfoStore = useNodeInfoStore();
    constructor(editor: CanvasEditor, snapGuide: SnapGuide) {
        this._editor = editor;
        this._scene = editor.scene;

        this._uiComponent = new ResizerUI(this._scene);

        this._scene.topLayer.addChild(this._uiComponent.node!);
        this._eventsHandler = new EventsHandler(
            editor,
            this._uiComponent,
            snapGuide
        );

        this._eventsHandler.on(EventNames.POINTER_DOWN_NODE, (node?: SNode) => {
            if (!node) {
                this.unMount();
            } else {
                // 先根据当前 node的 uuid查找 nodeInfoStore 中的 lockedNodeGroup 是否包含该 node的 uuid
                const lockedNodeGroup = this._nodeInfoStore.lockedNodeGroup;
                const group = lockedNodeGroup.find((group) =>
                    group.includes(node.uuid)
                );
                if (group) {
                    // 如果包含，则把同组的节点一起加入
                    const allNodes = this._editor.scene.getAllNodes();
                    const nodes = allNodes.filter((node) => {
                        return group.includes(node.uuid);
                    });
                    this.mountToNode(nodes, true);
                    return;
                }
                this.mountToNode([node]);
            }
        });
        this._eventsHandler.on(EventNames.DRAG_SELECT_END, (nodes: SNode[]) => {
            this.mountToNode(nodes);
        });

        watch(
            () => this._nodeInfoStore.lockedNodeGroup,
            (lockedNodeGroups) => {
                /**
                 * 如果当前选中节点不在 lockedNodeGroup 中，则解锁
                 * 如果当前选中节点在 lockedNodeGroup 中，则锁定
                 */
                const currentSelectedNodeIds =
                    this._nodeInfoStore.currentSelectedNodeIds;
                const isLocked = lockedNodeGroups.some((group) =>
                    group.includes(currentSelectedNodeIds[0])
                );
                this._uiComponent.setLocked(isLocked);
                this._uiComponent.updateHandlerNodes();
            },
            { deep: true }
        );
    }

    public mountToNode(targetNodes: SNode[], isLock = false): void {
        if (targetNodes.length === 0) {
            this.unMount();
            return;
        }
        if (targetNodes.length === 1) {
            this._uiComponent.alignToNode(targetNodes[0]);
        } else {
            const worldRect = getWorldRect(targetNodes);
            const dummyNode = new SNode();
            dummyNode.position.set(worldRect[0], worldRect[1]);
            dummyNode.width = worldRect[2] - worldRect[0];
            dummyNode.height = worldRect[3] - worldRect[1];
            dummyNode.anchor.set(0, 0);

            this._uiComponent.alignToNode(dummyNode);
        }
        const uuids = targetNodes.map((node) => node.uuid);

        this._nodeInfoStore.setCurrentSelectedNodeIds(uuids);

        this._uiComponent.setCurrentTargetNodes(targetNodes);
        this._uiComponent.show();
        this._uiComponent.updateHandlerNodes();
    }

    public unMount(): void {
        this._nodeInfoStore.setCurrentSelectedNodeIds([]);
        this._uiComponent.setCurrentTargetNodes([]);
        this._uiComponent.hide();
    }

    public destroy(): void {}
}
