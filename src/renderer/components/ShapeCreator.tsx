import { ShapeType, SNodeConfig, SNodeEvents } from "@/common/types";
import { CanvasEditor } from "../Editor";
import { EditorMode, useEditorModeStore } from "@/store/EditorModeStore";
import { createElement } from "../createElement";
import SNode from "../SNode";
import { createNodeFromConfig } from "../util";
import eventBus from "@/common/eventBus";
import { Vec2 } from "@/common/Vec2";
import { ReadonlyVec2 } from "gl-matrix";

export class ShapeCreator {

    private _presetShapes: Partial<Record<ShapeType, SNode>> = {};
    private _presetShapeConfigs: Partial<Record<ShapeType, SNodeConfig.Config>> = {};
    private _currentInsertShape: SNode | undefined = undefined;
    private editorModeStore: ReturnType<typeof useEditorModeStore>;
    private _canvasNode: SNode;
    constructor(private _editor: CanvasEditor) {
        this._createPresetShape();
        
        const editorModeStore = useEditorModeStore();
        this.editorModeStore = editorModeStore;
        const canvasNode = _editor.scene.getCanvasNode();
        this._canvasNode = canvasNode;
        _editor.eventSystem.addSystemEventListener(SNodeEvents.POINTER_MOVE, (event) => {
            if (editorModeStore.isShapeInsertMode) {
                const worldPos = event.getWorldPosition();
                const localPos = canvasNode.toLocal(worldPos);
                if (this._currentInsertShape) {
                    this._currentInsertShape.position.set(localPos[0], localPos[1]);
                    eventBus.reDraw();
                }
            }
        });
        editorModeStore.$subscribe((mutation, state) => {
            // mutation包含变化的详细信息
            // console.log('Store发生变化:', mutation);
            // console.log('当前状态:', state);
            this.removeCurrentInsertShape();
            if (state.currentMode !== EditorMode.SHAPE_INSERT) {
                return;
            }
            if (state.currentInsertShape === SNodeConfig.NodeType.RECT) {
                this._currentInsertShape = this._presetShapes.rect;
            } else if (state.currentInsertShape === SNodeConfig.NodeType.TRI) {

            }
            if (this._currentInsertShape) {
                canvasNode.addChild(this._currentInsertShape);
            }
        });

        _editor.eventSystem.addSystemEventListener(SNodeEvents.POINTER_DOWN, (event) => {
            if (editorModeStore.isShapeInsertMode) {
                console.log('pointer down');
                const worldPos = event.getWorldPosition();
                const localPos = canvasNode.toLocal(worldPos);

                this.insertShape(localPos);
            }
        });
    }

    private insertShape(localPos: ReadonlyVec2) {
        const currentShape = this.editorModeStore.currentInsertShape;
        if (currentShape === SNodeConfig.NodeType.RECT) {
            const rect = createNodeFromConfig(this._presetShapeConfigs.rect!);
            rect.position.set(localPos[0], localPos[1]);
            this._canvasNode.addChild(rect);
        } else if (currentShape === SNodeConfig.NodeType.TRI) {
            const tri = createNodeFromConfig(this._presetShapeConfigs.tri!);
            tri.position.set(localPos[0], localPos[1]);
            this._canvasNode.addChild(tri);
        }
        
        this._exitShapeInsertMode();
        eventBus.reDraw();
    }

    private _exitShapeInsertMode() {
        this.editorModeStore.setShapeInsertMode(false);
        if (this._currentInsertShape) {
            this._currentInsertShape.removeFromParent();
            this._currentInsertShape = undefined;
        }
    }

    private removeCurrentInsertShape() {
        if (this._currentInsertShape) {
            this._currentInsertShape.removeFromParent();
        }
    }

    private _createPresetShape() {
        const rectConfig = <rect width={100} height={100} style={{
            fill: 0xF0F4FC,
            stroke: 0x000000,
            strokeWidth: 2,
            alpha: 0.5
        }}></rect>
        const triConfig = <tri props={{
            width: 100,
            height: 100,
        }} width={100} height={100} style={{
            fill: 0xF0F4FC,
            stroke: 0x000000,
            strokeWidth: 2,
            alpha: 0.5
        }}></tri>
        this._presetShapeConfigs.rect = rectConfig;
        this._presetShapeConfigs.tri = triConfig;
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