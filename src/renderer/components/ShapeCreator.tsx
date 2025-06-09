import { ShapeType, SNodeEvents } from "@/common/types";
import { CanvasEditor } from "../Editor";
import { EditorMode, useEditorModeStore } from "@/store/EditorModeStore";
import { createElement } from "../createElement";
import SNode from "../SNode";
import { createNodeFromConfig } from "../util";

export class ShapeCreator {

    private _presetShapes: Partial<Record<ShapeType, SNode>> = {};
    constructor(private _editor: CanvasEditor) {
        this._createPresetShape();
        const editorModeStore = useEditorModeStore();
        const canvasNode = _editor.scene.getCanvasNode();
        _editor.eventSystem.addSystemEventListener(SNodeEvents.POINTER_MOVE, (event) => {
            if (editorModeStore.isShapeInsertMode) {
                // const worldPos = event.getWorldPosition();
                // const localPos = canvasNode.toLocal(worldPos);
                // console.log(localPos);
            }
        });

        _editor.eventSystem.addSystemEventListener(SNodeEvents.POINTER_DOWN, (event) => {
            if (editorModeStore.isShapeInsertMode) {
                console.log('pointer down');
                const worldPos = event.getWorldPosition();
                const localPos = canvasNode.toLocal(worldPos);
                console.log(localPos);
                editorModeStore.setMode(EditorMode.DEFAULT)
            }
        });
    }

    private _createPresetShape() {
        const rectConfig = <rect props={{
            width: 100,
            height: 100,
        }} style={{
            fill: 0xff0000,
            stroke: 0x000000,
        }}></rect>
        const triConfig = <tri width={100} height={100} style={{
            fill: 0xF0F4FC,
            stroke: 0x000000,
            strokeWidth: 2,
        alpha: 0.5
        }}></tri>
        const rect = createNodeFromConfig(rectConfig);
        const tri = createNodeFromConfig(triConfig);

        this._presetShapes.rect = rect;
        this._presetShapes.tri = tri;
    }

    destroy() {
        this._editor.eventSystem.removeSystemEventListener(SNodeEvents.POINTER_MOVE, (event) => {
            console.log('event', event);
        });
    }
}