import {
    EnumParaLayoutMode,
    EnumParaResizeMode,
    SNodeConfig,
    SNodeEvents,
} from '@/common/types';
import { CanvasEditor } from '../Editor';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';
import { createElement } from '../createElement';
import SNode from '../SNode';
import { createNodeFromConfig } from '../util';
import eventBus from '@/common/eventBus';
import { ReadonlyVec2 } from 'gl-matrix';
import { SGeo } from '../Geometry/SGeo';
import { CanvasEventSystem } from '../SEventManager';
import { SParagraph } from '../RenderComponents/SParagraph';

export class ShapeCreator {
    private _presetShapes: Partial<Record<SNodeConfig.NodeType, SNode>> = {};
    private _presetShapeConfigs: Partial<
        Record<SNodeConfig.NodeType, SNodeConfig.Config>
    > = {};
    private _currentInsertShape: SNode | undefined = undefined;
    private editorModeStore: ReturnType<typeof useEditorModeStore>;
    private _canvasNode: SNode;

    // 默认形状样式配置
    private static readonly DEFAULT_SHAPE_STYLE = {
        fill: 0xf0f4fc,
        stroke: 0x000000,
        strokeWidth: 2,
        alpha: 0.5,
    } as const;

    constructor(private _editor: CanvasEditor) {
        this._createPresetShape();

        const editorModeStore = useEditorModeStore();
        this.editorModeStore = editorModeStore;
        const canvasNode = _editor.scene.getCanvasNode();
        this._canvasNode = canvasNode;
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
            } else if (
                state.currentInsertShape === SNodeConfig.NodeType.ELLIPSE
            ) {
                this._currentInsertShape = this._presetShapes.ellipse;
            } else if (
                state.currentInsertShape === SNodeConfig.NodeType.DIAMOND
            ) {
                this._currentInsertShape = this._presetShapes.diamond;
            } else if (
                state.currentInsertShape === SNodeConfig.NodeType.PARALLELOGRAM
            ) {
                this._currentInsertShape = this._presetShapes.parallelogram;
            }
            if (this._currentInsertShape) {
                canvasNode.addChild(this._currentInsertShape);
            }
        });

        _editor.eventSystem.addSystemEventListener(
            SNodeEvents.POINTER_DOWN,
            (event) => {
                if (editorModeStore.isShapeInsertMode) {
                    // console.log('pointer down');
                    const worldPos = event.getWorldPosition();
                    const localPos = canvasNode.toLocal(worldPos);

                    this.insertShape(localPos);
                }
            }
        );
    }

    private _addEventsToShapeNode(node: SNode) {
        CanvasEventSystem.instance.addEventListener(
            node,
            SNodeEvents.DB_CLICK,
            (event: SNodeEvents.IPointerEvent) => {
                const hasText = !!node.children[0];
                if (hasText) {
                    eventBus.enterEditMode(node.children[0]!);
                    return;
                }
                this._insertTextToShapeNode(node);
            }
        );
    }

    private _insertTextToShapeNode(shapeNode: SNode) {
        const hasText = !!shapeNode.children[0];
        if (hasText) {
            return;
        }
        const textConfig = (
            <para
                name="text"
                text="Text"
                fontSize={30}
                transform={{
                    anchor: { x: 0.5, y: 0.5 },
                }}
                width={shapeNode.width}
                color={[0, 0, 0, 1]}
                layoutMode={EnumParaLayoutMode.DEPEND_PARENT}
                resizeMode={EnumParaResizeMode.ONLY_NODE}
            />
        );
        const textNode = createNodeFromConfig(textConfig);
        shapeNode.addChild(textNode);
        const textComp = textNode.getComponent(SParagraph);
        if (textComp) {
            textComp.setBelongToNode(shapeNode);
        }
        setTimeout(() => {
            eventBus.enterEditMode(textNode);
        }, 100);
    }

    public getShadowShape(): SNode | undefined {
        return this._currentInsertShape;
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
            const ellipse = createNodeFromConfig(
                this._presetShapeConfigs.ellipse!
            );
            newNode = ellipse;
        } else if (currentShape === SNodeConfig.NodeType.DIAMOND) {
            const diamond = createNodeFromConfig(
                this._presetShapeConfigs.diamond!
            );
            newNode = diamond;
        } else if (currentShape === SNodeConfig.NodeType.PARALLELOGRAM) {
            const parallelogram = createNodeFromConfig(
                this._presetShapeConfigs.parallelogram!
            );
            newNode = parallelogram;
        }

        if (newNode) {
            newNode.position.set(localPos[0], localPos[1]);
            this._canvasNode.addChild(newNode);

            const geoComp = newNode.getComponent(SGeo);
            if (geoComp) {
                geoComp.setAlpha(1);
            }
            this._addEventsToShapeNode(newNode);
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

        const rectConfig = (
            <rect width={100} height={100} style={commonStyle}></rect>
        );

        const triConfig = (
            <tri width={100} height={100} style={commonStyle}></tri>
        );

        const ellipseConfig = (
            <ellipse width={100} height={100} style={commonStyle}></ellipse>
        );

        const diamondConfig = (
            <diamond width={100} height={100} style={commonStyle}></diamond>
        );

        const parallelogramConfig = (
            <parallelogram
                width={100}
                height={100}
                style={commonStyle}
            ></parallelogram>
        );

        // 保存配置（只保存ShapeType支持的形状）
        this._presetShapeConfigs.rect = rectConfig;
        this._presetShapeConfigs.tri = triConfig;
        this._presetShapeConfigs.ellipse = ellipseConfig;
        this._presetShapeConfigs.diamond = diamondConfig;
        this._presetShapeConfigs.parallelogram = parallelogramConfig;

        // 创建预设形状实例
        const rect = createNodeFromConfig(rectConfig);
        const tri = createNodeFromConfig(triConfig);
        const ellipse = createNodeFromConfig(ellipseConfig);
        const diamond = createNodeFromConfig(diamondConfig);
        const parallelogram = createNodeFromConfig(parallelogramConfig);

        this._presetShapes.rect = rect;
        this._presetShapes.tri = tri;
        this._presetShapes.ellipse = ellipse;
        this._presetShapes.diamond = diamond;
        this._presetShapes.parallelogram = parallelogram;
    }

    destroy() {
        this._editor.eventSystem.removeSystemEventListener(
            SNodeEvents.POINTER_MOVE,
            (event) => {
                // console.log('event', event);
            }
        );
    }
}
