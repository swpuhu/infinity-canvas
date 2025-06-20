import { SNodeConfig, SNodeEvents } from "@/common/types";
import { CanvasEditor } from "../Editor";
import { EditorMode, useEditorModeStore } from "@/store/EditorModeStore";
import { createElement } from "../createElement";
import SNode from "../SNode";
import { createNodeFromConfig } from "../util";
import eventBus from "@/common/eventBus";
import { ReadonlyVec2 } from "gl-matrix";
import { SGeo } from "../Geometry/SGeo";

export class TextCreator {

    private _presetShadowTextConfig: SNodeConfig.Config | undefined = undefined;
    private _presetShadowText: SNode | undefined = undefined;

    private _presetTextConfig: SNodeConfig.Config | undefined = undefined;
    private _presetText: SNode | undefined = undefined;

    private _currentInsertText: SNode | undefined = undefined;
    private editorModeStore: ReturnType<typeof useEditorModeStore>;
    private _canvasNode: SNode;

    constructor(private _editor: CanvasEditor) {
        this._createPresetText();
        
        const editorModeStore = useEditorModeStore();
        this.editorModeStore = editorModeStore;
        const canvasNode = _editor.scene.getCanvasNode();
        this._canvasNode = canvasNode;
        editorModeStore.$subscribe((mutation, state) => {
            this.removeCurrentInsertText();
            if (state.currentMode !== EditorMode.TEXT_INSERT) {
                return;
            }
            this._currentInsertText = this._presetShadowText;
            if (this._currentInsertText) {
                canvasNode.addChild(this._currentInsertText);
            }
        });

        _editor.eventSystem.addSystemEventListener(SNodeEvents.POINTER_DOWN, (event) => {
            if (editorModeStore.isTextInsertMode) {
                console.log('pointer down');
                const worldPos = event.getWorldPosition();
                const localPos = canvasNode.toLocal(worldPos);

                this.insertText(localPos);
            }
        });
    }


    private insertText(localPos: ReadonlyVec2) {

        if (!this._presetTextConfig) {
            return;
        }


        const newNode: SNode = createNodeFromConfig(this._presetTextConfig);

        if (newNode) {
            newNode.position.set(localPos[0], localPos[1]);
            this._canvasNode.addChild(newNode);
        }
        
        this._exitTextInsertMode();
        eventBus.reDraw();
    }

    private _exitTextInsertMode() {
        this.editorModeStore.setTextInsertMode(false);
        if (this._currentInsertText) {
            this._currentInsertText.removeFromParent();
            this._currentInsertText = undefined;
        }
    }

    private removeCurrentInsertText() {
        if (this._currentInsertText) {
            this._currentInsertText.removeFromParent();
        }
    }

    public getShadowText(): SNode | undefined {
        return this._currentInsertText;
    }

    private _createPresetText() {
        const paraConfig = (
            <para
                name="text"
                text="懒羊羊组长赛高！"
                fontSize={50}
                transform={{
                    anchor: { x: 0, y: 0 },
                }}
                width={300}
                color={[0, 0, 0, 0.5]}
            />
        );
        const paraConfig2 = (
            <para
                name="text"
                text="懒羊羊组长赛高！"
                fontSize={50}
                transform={{
                    anchor: { x: 0, y: 0 },
                }}
                width={300}
                color={[0, 0, 0, 1]}
            />
        );
        this._presetShadowTextConfig = paraConfig;
        this._presetShadowText = createNodeFromConfig(paraConfig);
        this._presetTextConfig = paraConfig2;
        this._presetText = createNodeFromConfig(paraConfig2);
    }

    destroy() {
    }
}