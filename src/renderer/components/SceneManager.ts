import { SNodeConfig } from '@/common/types';
import { CanvasEditor } from '../Editor';
import SNode from '../SNode';
import presetShapes from './PresetShapes';
import eventBus from '@/common/eventBus';
import { createNodeFromConfig } from '../util';

export class SceneManager {
    private _presetShapes = presetShapes;
    constructor(private _editor: CanvasEditor) {
        eventBus.onInsertPresetNodeIntoScene(this._onInsertPresetNodeIntoScene);
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
