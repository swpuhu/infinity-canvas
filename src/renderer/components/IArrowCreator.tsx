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
import {
    EnumParaLayoutMode,
    EnumParaResizeMode,
    SNodeConfig,
    SNodeEvents,
} from '@/common/types';

export class IArrowCreator {
    private _currentInsertArrow: SNode | undefined = undefined;
    private editorModeStore: ReturnType<typeof useEditorModeStore>;
    private _canvasNode: SNode;

    constructor(private _editor: CanvasEditor) {
        const editorModeStore = useEditorModeStore();
        this.editorModeStore = editorModeStore;
        const canvasNode = _editor.scene.getCanvasNode();
        this._canvasNode = canvasNode;

        editorModeStore.$subscribe((mutation, state) => {
            this.removeCurrentInsertArrow();
            if (state.currentMode !== EditorMode.ARROW_INSERT) {
                return;
            }

            // Create a preview arrow for insertion
            const arrowConfig: SNodeConfig.IArrowConfig = {
                type: SNodeConfig.NodeType.IARROW,
                name: 'arrow-preview',
                points: [
                    [0, 0],
                    [100, 0]
                ],
                style: {
                    stroke: [0, 0, 0, 1],
                    strokeWidth: 2,
                },
            };
            this._currentInsertArrow = createNodeFromConfig(arrowConfig);

            if (this._currentInsertArrow) {
                canvasNode.addChild(this._currentInsertArrow);
            }
        });

        _editor.eventSystem.addSystemEventListener(
            SNodeEvents.POINTER_DOWN,
            (event: any) => {
                if (editorModeStore.isToolActive(EditorMode.ARROW_INSERT)) {
                    const worldPos = event.getWorldPosition();
                    const localPos = canvasNode.toLocal(worldPos);
                    this.insertArrow(localPos);
                }
            }
        );

        _editor.eventSystem.addSystemEventListener(
            SNodeEvents.POINTER_MOVE,
            (event: any) => {
                if (
                    editorModeStore.isToolActive(EditorMode.ARROW_INSERT) &&
                    this._currentInsertArrow
                ) {
                    const worldPos = event.getWorldPosition();
                    const localPos = canvasNode.toLocal(worldPos);
                    this.updatePreviewArrow(localPos);
                }
            }
        );
    }

    private updatePreviewArrow(currentPos: ReadonlyVec2) {
        if (!this._currentInsertArrow) return;

        // Update the preview arrow to follow mouse with dynamic end point
        // This would need to be implemented based on your arrow component structure
    }

    private _addEventsToArrowNode(node: SNode) {
        CanvasEventSystem.instance.addEventListener(
            node,
            SNodeEvents.DB_CLICK,
            () => {
                const hasText = !!node.children[0];
                if (hasText) {
                    eventBus.enterEditMode(node.children[0]!);
                    return;
                }
                this._insertTextToArrowNode(node);
            }
        );
    }

    private _insertTextToArrowNode(arrowNode: SNode) {
        const hasText = !!arrowNode.children[0];
        if (hasText) {
            return;
        }

        // Calculate text position at arrow center
        const textConfig = {
            type: SNodeConfig.NodeType.PARAGRAPH,
            name: 'text',
            text: 'Text',
            fontSize: 16,
            transform: {
                anchor: { x: 0.5, y: 0.5 },
                position: { x: 0, y: -20 },
            },
            width: 100,
            color: [0, 0, 0, 1],
            layoutMode: EnumParaLayoutMode.DEPEND_PARENT,
            resizeMode: EnumParaResizeMode.ONLY_NODE,
        };
        const textNode = createNodeFromConfig(textConfig);
        arrowNode.addChild(textNode);

        const textComp = textNode.getComponent(SParagraph);
        if (textComp) {
            textComp.setBelongToNode(arrowNode);
        }

        setTimeout(() => {
            eventBus.enterEditMode(textNode);
        }, 100);
    }

    public getShadowArrow(): SNode | undefined {
        return this._currentInsertArrow;
    }

    private insertArrow(localPos: ReadonlyVec2) {
        // Create arrow with start point at click position
        const arrowConfig: SNodeConfig.IArrowConfig = {
            type: SNodeConfig.NodeType.IARROW,
            name: 'arrow',
            points: [
                [localPos[0], localPos[1]],
                [localPos[0] + 100, localPos[1]] // Default length of 100px
            ],
            style: {
                stroke: [0, 0, 0, 1],
                strokeWidth: 2,
            },
        };

        const newArrow = createNodeFromConfig(arrowConfig);
        this._canvasNode.addChild(newArrow);

        const geoComp = newArrow.getComponent(SGeo);
        if (geoComp) {
            geoComp.setAlpha(1);
        }

        this._addEventsToArrowNode(newArrow);
        this._exitArrowInsertMode();
        eventBus.reDraw();
    }

    private _exitArrowInsertMode() {
        this.editorModeStore.setMode(EditorMode.DEFAULT);
        if (this._currentInsertArrow) {
            this._currentInsertArrow.removeFromParent();
            this._currentInsertArrow = undefined;
        }
    }

    private removeCurrentInsertArrow() {
        if (this._currentInsertArrow) {
            this._currentInsertArrow.removeFromParent();
        }
    }

    destroy() {
        // Clean up event listeners would need proper references
        // This is a simplified version - actual implementation may need proper cleanup
    }
}
