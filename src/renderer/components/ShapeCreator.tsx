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
import presetShapes from './PresetShapes';
import { DEFAULT_SHAPE_STYLE } from '@/common/const';

export class ShapeCreator {
    private _presetShapes = presetShapes;
    private _currentInsertShape: SNode | undefined = undefined;
    private editorModeStore: ReturnType<typeof useEditorModeStore>;
    private _canvasNode: SNode;

    constructor(private _editor: CanvasEditor) {
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
            const currentInsertShapeType = state.currentInsertShape;
            this._currentInsertShape = this._presetShapes[
                currentInsertShapeType as keyof typeof this._presetShapes
            ] as SNode;

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
        const currentShapeType = this.editorModeStore.currentInsertShape;

        eventBus.insertPresetNodeIntoScene(
            currentShapeType,
            {
                style: DEFAULT_SHAPE_STYLE,
            },
            (newNode) => {
                newNode.position.set(localPos[0], localPos[1]);
                this._canvasNode.addChild(newNode);

                const geoComp = newNode.getComponent(SGeo);
                if (geoComp) {
                    geoComp.setAlpha(1);
                }
                this._addEventsToShapeNode(newNode);
                this._exitShapeInsertMode();
                eventBus.reDraw();
            }
        );
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

    destroy() {
        this._editor.eventSystem.removeSystemEventListener(
            SNodeEvents.POINTER_MOVE,
            (event) => {
                // console.log('event', event);
            }
        );
    }
}
