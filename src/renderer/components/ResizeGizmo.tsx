import { EventNames } from '@/common/types';
import { CanvasEditor } from '../Editor';
import SNode from '../SNode';
import { getWorldRect } from '../util';
import { WhiteboardScene } from '../WhiteboardScene';
import { EventsHandler } from './resizer/EventsHandler';
import { ResizerUI } from './resizer/ResizerUI';
import { SnapGuide } from './SnapGuide';
import { useNodeInfoStore } from '@/store/NodeInfoStore';

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
                this.mountToNode([node]);
            }
        });
        this._eventsHandler.on(EventNames.DRAG_SELECT_END, (nodes: SNode[]) => {
            this.mountToNode(nodes);
        });
    }

    public mountToNode(targetNodes: SNode[]): void {
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

        this._uiComponent.show();
        this._uiComponent.updateHandlerNodes();
    }

    public unMount(): void {
        this._nodeInfoStore.setCurrentSelectedNodeIds([]);
        this._uiComponent.hide();
    }

    public destroy(): void {}
}
