import { CanvasEditor } from '../Editor';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';
import { createElement } from '../createElement';
import SNode from '../SNode';
import { createNodeFromConfig } from '../util';
import eventBus from '@/common/eventBus';
import { ReadonlyVec2 } from 'gl-matrix';
import { SNodeEvents } from '@/common/types';
import { SIArrow } from '../RenderComponents/SIArrow';
import { DEFAULT_SHADOW_ALPHA, DEFAULT_SHADOW_STROKE } from '@/common/const';

export class IArrowCreator {
    private editorModeStore: ReturnType<typeof useEditorModeStore>;
    private _presetIArrowNode: SNode | null = null;
    private _canvasNode: SNode;

    private _pointerDownCount = 0;

    private _startPos: ReadonlyVec2 = [0, 0];
    private _endPos: ReadonlyVec2 = [0, 0];

    constructor(private _editor: CanvasEditor) {
        const editorModeStore = useEditorModeStore();
        this.editorModeStore = editorModeStore;
        const canvasNode = _editor.scene.getCanvasNode();
        this._canvasNode = canvasNode;

        this._createPresetArrow();
        editorModeStore.$subscribe(this.onEditorModeChange);

        _editor.eventSystem.addSystemEventListener(
            SNodeEvents.POINTER_DOWN,
            (event: any) => {
                if (!editorModeStore.isToolActive(EditorMode.ARROW_INSERT)) {
                    return;
                }

                this._pointerDownCount++;
                const worldPos = event.getWorldPosition();
                const localPos = canvasNode.toLocal(worldPos);
                if (this._pointerDownCount === 1) {
                    this._startPos = localPos;
                    return;
                }
                if (this._pointerDownCount === 2) {
                    this._endPos = localPos;
                    this.insertArrow(this._startPos, this._endPos);
                    this._pointerDownCount = 0;
                }
            }
        );

        _editor.eventSystem.addSystemEventListener(
            SNodeEvents.POINTER_MOVE,
            (event: any) => {
                if (editorModeStore.isToolActive(EditorMode.ARROW_INSERT)) {
                    const worldPos = event.getWorldPosition();
                    const localPos = canvasNode.toLocal(worldPos);
                    if (this._pointerDownCount === 1) {
                        this.updatePreviewArrow(localPos);
                    }
                }
            }
        );
    }

    private _createPresetArrow(): void {
        const arrowConfig = (
            <iarrow
                name="iarrow"
                width={200}
                height={20}
                style={{
                    stroke: DEFAULT_SHADOW_STROKE,
                    alpha: DEFAULT_SHADOW_ALPHA,
                }}
                points={[
                    [0, 0],
                    [500, -200],
                ]}
            />
        );

        this._presetIArrowNode = createNodeFromConfig(arrowConfig);
    }

    private onEditorModeChange = (
        _: any,
        state: ReturnType<typeof useEditorModeStore>['$state']
    ) => {
        if (this._presetIArrowNode && this._presetIArrowNode.parent) {
            this._presetIArrowNode.removeFromParent();
        }
        if (state.currentMode !== EditorMode.ARROW_INSERT) {
            return;
        }
        const canvasNode = this._editor.scene.getCanvasNode();
        canvasNode.addChild(this._presetIArrowNode!);
    };

    private updatePreviewArrow(currentPos: ReadonlyVec2) {
        if (!this._presetIArrowNode) {
            return;
        }
        const iArrow = this._presetIArrowNode.getComponent(SIArrow);
        if (!iArrow) {
            return;
        }
        iArrow.setPoints([this._startPos, currentPos]);
    }

    private insertArrow(startPos: ReadonlyVec2, endPos: ReadonlyVec2) {
        // Create arrow with start point at click position
        const arrowConfig = (
            <iarrow
                name="iarrow"
                width={0}
                height={0}
                style={{
                    stroke: DEFAULT_SHADOW_STROKE,
                    alpha: 1,
                }}
                points={[startPos, endPos]}
            />
        );

        const newArrow = createNodeFromConfig(arrowConfig);
        this._canvasNode.addChild(newArrow);

        this._exitArrowInsertMode();
        eventBus.reDraw();
    }

    private _exitArrowInsertMode() {
        this.editorModeStore.setMode(EditorMode.DEFAULT);
        if (this._presetIArrowNode && this._presetIArrowNode.parent) {
            this._presetIArrowNode.removeFromParent();
        }
    }

    destroy() {
        // Clean up event listeners would need proper references
        // This is a simplified version - actual implementation may need proper cleanup
    }
}
