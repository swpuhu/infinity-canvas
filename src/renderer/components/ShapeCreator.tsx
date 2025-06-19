import { SNodeConfig, SNodeEvents } from "@/common/types";
import { CanvasEditor } from "../Editor";
import { EditorMode, useEditorModeStore } from "@/store/EditorModeStore";
import { createElement } from "../createElement";
import SNode from "../SNode";
import { createNodeFromConfig } from "../util";
import eventBus from "@/common/eventBus";
import { ReadonlyVec2 } from "gl-matrix";
import { SGeo } from "../Geometry/SGeo";

export class ShapeCreator {

    private _presetShapes: Partial<Record<SNodeConfig.NodeType, SNode>> = {};
    private _presetShapeConfigs: Partial<Record<SNodeConfig.NodeType, SNodeConfig.Config>> = {};
    private _currentInsertShape: SNode | undefined = undefined;
    private editorModeStore: ReturnType<typeof useEditorModeStore>;
    private _canvasNode: SNode;

    // 默认形状样式配置
    private static readonly DEFAULT_SHAPE_STYLE = {
        fill: 0xF0F4FC,
        stroke: 0x000000,
        strokeWidth: 2,
        alpha: 0.5
    } as const;

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
                this._currentInsertShape = this._presetShapes.tri;
            } else if (state.currentInsertShape === SNodeConfig.NodeType.ELLIPSE) {
                this._currentInsertShape = this._presetShapes.ellipse;
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
        let newNode: SNode | undefined = undefined;
        if (currentShape === SNodeConfig.NodeType.RECT) {
            const rect = createNodeFromConfig(this._presetShapeConfigs.rect!);
            newNode = rect;
        } else if (currentShape === SNodeConfig.NodeType.TRI) {
            const tri = createNodeFromConfig(this._presetShapeConfigs.tri!);
            newNode = tri;
        } else if (currentShape === SNodeConfig.NodeType.ELLIPSE) {
            const ellipse = createNodeFromConfig(this._presetShapeConfigs.ellipse!);
            newNode = ellipse;
        }


        if (newNode) {
            newNode.position.set(localPos[0], localPos[1]);
            this._canvasNode.addChild(newNode);
            
            const geoComp = newNode.getComponent(SGeo);
            if (geoComp) {
                geoComp.setAlpha(1);
            }
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
        // 使用统一的样式配置
        const commonStyle = ShapeCreator.DEFAULT_SHAPE_STYLE;

        const rectConfig = <rect 
            width={100} 
            height={100} 
            style={commonStyle}
        ></rect>;

        const triConfig = <tri 
            width={100} 
            height={100} 
            style={commonStyle}
        ></tri>;

        const ellipseConfig = <ellipse width={100} height={100} style={commonStyle}></ellipse>;

        // 保存配置（只保存ShapeType支持的形状）
        this._presetShapeConfigs.rect = rectConfig;
        this._presetShapeConfigs.tri = triConfig;
        this._presetShapeConfigs.ellipse = ellipseConfig;

        // 创建预设形状实例
        const rect = createNodeFromConfig(rectConfig);
        const tri = createNodeFromConfig(triConfig);
        const ellipse = createNodeFromConfig(ellipseConfig);

        this._presetShapes.rect = rect;
        this._presetShapes.tri = tri; 
        this._presetShapes.ellipse = ellipse;
    }

    destroy() {
        this._editor.eventSystem.removeSystemEventListener(SNodeEvents.POINTER_MOVE, (event) => {
            console.log('event', event);
        });
    }
}