import { ResizeGizmoMode, SNodeEvents } from '@/common/types';
import { CanvasEditor } from '@/renderer/Editor';
import { SParagraph } from '@/renderer/RenderComponents/SParagraph';
import SNode from '@/renderer/SNode';
import { ReadonlyVec2 } from 'gl-matrix';
import { ResizerUI } from './ResizerUI';
import eventBus from '@/common/eventBus';
import { alignToNode } from '@/renderer/util';
import { isText } from '@/common/util';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';
import { CanvasEventSystem } from '@/renderer/SEventManager';

export class EditEventsHandler {
    private _hideTextArea: HTMLTextAreaElement | null = null;

    private _currentText: SParagraph | null = null;

    private _cursorDiv: HTMLElement | null = null;

    private _dummyCursorNode = new SNode();

    private _editorModeStore = useEditorModeStore();
    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        this._initHideTextArea();
    }

    public setCurrentNode(node: SNode): void {
        if (isText(node)) {
            this._currentText = node.getComponent(SParagraph);
        }
    }

    private _initHideTextArea(): void {
        this._hideTextArea = document.createElement('textarea');
        this._hideTextArea.classList.add('text-area', 'hide');
        this._hideTextArea.wrap = 'off';

        this._cursorDiv = document.createElement('div');
        this._cursorDiv.classList.add('cursor', 'hide');

        this._editor.canvas.parentElement!.appendChild(this._hideTextArea);
        this._editor.canvas.parentElement!.appendChild(this._cursorDiv);
        this._hideTextArea.addEventListener(
            'compositionupdate',
            this._onHideTextAreaInput
        );
        this._hideTextArea.addEventListener('input', this._onHideTextAreaInput);

        this._hideTextArea.addEventListener(
            'selectionchange',
            this._onHideTextAreaSelectionChange
        );
    }

    private _onHideTextAreaInput = (event: Event): void => {
        const e = event as InputEvent | CompositionEvent;
        if (this._currentText) {
            this._currentText.text = this._hideTextArea!.value;
            alignToNode(this._resizerUI.node!, this._currentText.node!);
            this._resizerUI.updateHandlerNodes();
            eventBus.reDraw();
        }
    };

    private _focusTextArea(
        textComp: SParagraph,
        startIndex: number,
        endIndex: number
    ): void {
        this._hideTextArea!.classList.remove('hide');
        this._hideTextArea!.textContent = textComp.text;

        setTimeout(() => {
            this._hideTextArea!.focus();
            this._hideTextArea!.setSelectionRange(startIndex, endIndex);
        }, 100);
    }

    private _setCursorAndFocusTextArea(
        node: SNode,
        event: SNodeEvents.IPointerEvent
    ): number {
        const textComp = node.getComponent(SParagraph);
        this._editorModeStore.setMode(EditorMode.TEXT_EDIT);
        if (textComp) {
            const eventLocalPos = event.getLocalPosition(node);
            const cursorIndex = textComp.getCursorIndex(
                eventLocalPos[0],
                eventLocalPos[1]
            );
            this._currentText = textComp;
            this._focusTextArea(textComp, cursorIndex, cursorIndex);
            return cursorIndex;
        }
        return -1;
    }

    public enterEditMode(node: SNode, event: SNodeEvents.IPointerEvent): void {
        this._addTextEvents(node);
        this._setCursorAndFocusTextArea(node, event);
    }

    private _onTextChanged = (): void => {
        this._resizerUI.alignToNode(this._currentText!.node!);
    };

    private _addTextEvents(node: SNode): void {
        node.on(SNodeEvents.TEXT_CHANGED, this._onTextChanged);
        CanvasEventSystem.instance.addEventListener(
            node,
            SNodeEvents.POINTER_DOWN,
            this._onTextTouchStart
        );

        CanvasEventSystem.instance.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onTextTouchMove
        );
        CanvasEventSystem.instance.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onTextTouchUp
        );
    }

    private _removeTextEvents(node: SNode): void {
        node.off(SNodeEvents.TEXT_CHANGED, this._onTextChanged);
        CanvasEventSystem.instance.removeEventListener(
            node,
            SNodeEvents.POINTER_DOWN,
            this._onTextTouchStart
        );
        CanvasEventSystem.instance.removeEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onTextTouchMove
        );
        CanvasEventSystem.instance.removeEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onTextTouchUp
        );
    }

    private _touchStartCursorIndex: number = -1;

    private _onTextTouchStart = (event: SNodeEvents.IPointerEvent): void => {
        console.log('onTextTouchStart');
        if (!this._currentText) {
            return;
        }
        const node = this._currentText.node!;
        const cursorIndex = this._setCursorAndFocusTextArea(node, event);
        if (cursorIndex !== -1) {
            this._touchStartCursorIndex = cursorIndex;
        }
    };

    private _onTextTouchMove = (event: SNodeEvents.IPointerEvent): void => {
        if (!this._currentText) {
            return;
        }
        const localPos = event.getLocalPosition(this._currentText.node!);
        const touchMoveCursorIndex = this._currentText.getCursorIndex(
            localPos[0],
            localPos[1]
        );
        if (touchMoveCursorIndex !== -1 && this._touchStartCursorIndex !== -1) {
            this.selectText(this._touchStartCursorIndex, touchMoveCursorIndex);
        }
    };
    private _onTextTouchUp = (event: SNodeEvents.IPointerEvent): void => {
        console.log('onTextTouchUp', event);
    };

    public exitEditMode(): void {
        const currentMode = this._editorModeStore.currentMode;
        if (currentMode !== EditorMode.TEXT_EDIT) {
            return;
        }
        if (!this._currentText) {
            return;
        }
        this._removeTextEvents(this._currentText.node!);
        this._editorModeStore.setMode(EditorMode.DEFAULT);
        this._hideCursor();
        this._currentText!.unSelect();
        this._hideTextArea!.classList.add('hide');
        this._currentText = null;
    }

    private _hideCursor(): void {
        this._cursorDiv!.classList.add('hide');
    }

    private _showCursor(): void {
        this._cursorDiv!.classList.remove('hide');
        this._currentText?.unSelect();
    }

    private selectText(startIndex: number, endIndex: number): void {
        console.log('selectText', startIndex, endIndex);
        if (startIndex > endIndex) {
            [startIndex, endIndex] = [endIndex, startIndex];
        }
        this._hideTextArea!.setSelectionRange(startIndex, endIndex);
    }

    private _onHideTextAreaSelectionChange = (event: Event): void => {
        if (this._currentText) {
            const startIndex = this._hideTextArea!.selectionStart;
            const endIndex = this._hideTextArea!.selectionEnd;
            if (startIndex === endIndex) {
                this._currentText.unSelect();
                this._setCursorDivPositionByIndex(startIndex);
                eventBus.reDraw();
                return;
            }
            console.log('selection change', startIndex, endIndex);
            this._hideCursor();
            this._currentText.setSelectionRange(startIndex, endIndex);
            eventBus.reDraw();
        }
    };
    private _setCursorDivPositionByIndex(
        cursorIndex: number
    ): ReadonlyVec2 | null {
        if (!this._currentText) {
            return null;
        }
        const cursorInfo = this._currentText.getCursorInfoByIndex(cursorIndex);
        if (cursorInfo) {
            const worldPos = this._currentText.node!.toGlobal(cursorInfo.pos);
            this._showCursor();
            this._currentText.node?.addChild(this._dummyCursorNode);
            this._dummyCursorNode.setTransform({
                position: {
                    x: cursorInfo.pos[0],
                    y: cursorInfo.pos[1],
                },
            });
            const textWorldMatrix = this._dummyCursorNode.getWorldMatrix();
            this._dummyCursorNode.removeFromParent();
            const a = textWorldMatrix[0];
            const b = textWorldMatrix[1];
            const c = textWorldMatrix[3];
            const d = textWorldMatrix[4];
            const e = textWorldMatrix[6];
            const f = textWorldMatrix[7];
            const globalScale = this._dummyCursorNode.getGlobalScale();
            this._cursorDiv!.style.transform = `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;

            console.log(globalScale);
            this._cursorDiv!.style.height = cursorInfo.size + 'px';
            this._cursorDiv!.style.width = 1 / globalScale.x + 'px';
            if (worldPos) {
                setTimeout(() => {
                    const textAreaWidth = this._hideTextArea!.offsetWidth;
                    // 如果textAreaWidth + worldPos[0] > 画布宽度，则将textArea的right设为 0，不设置left
                    if (
                        textAreaWidth + worldPos[0] >
                        this._editor.canvas.parentElement!.offsetWidth
                    ) {
                        this._hideTextArea!.style.right = '0px';
                        this._hideTextArea!.style.left = 'auto';
                    } else {
                        this._hideTextArea!.style.left =
                            worldPos[0] + 50 + 'px';
                    }
                    this._hideTextArea!.style.top = worldPos[1] + 'px';
                }, 100);
            }
            return worldPos;
        }
        return null;
    }
}
