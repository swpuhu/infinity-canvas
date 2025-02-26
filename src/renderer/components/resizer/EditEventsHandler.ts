import { ResizeGizmoMode, SNodeEvents } from '@/common/types';
import { CanvasEditor } from '@/renderer/Editor';
import { SParagraph } from '@/renderer/RenderComponents/SParagraph';
import SNode from '@/renderer/SNode';
import { ReadonlyVec2 } from 'gl-matrix';
import { ResizerUI } from './ResizerUI';
import eventBus from '@/common/eventBus';
import { alignToNode } from '@/renderer/util';
import { isText } from '@/common/util';

export class EditEventsHandler {
    private _hideTextArea: HTMLTextAreaElement | null = null;

    private _currentText: SParagraph | null = null;

    private _cursorDiv: HTMLElement | null = null;

    private _dummyCursorNode = new SNode();

    private _currentMode: ResizeGizmoMode = ResizeGizmoMode.NONE;
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
        worldPos: ReadonlyVec2,
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

    public enterEditMode(node: SNode, event: SNodeEvents.IPointerEvent): void {
        const textComp = node.getComponent(SParagraph);
        this._currentMode = ResizeGizmoMode.EDIT;
        if (textComp) {
            const eventLocalPos = event.getLocalPosition(node);
            const cursorIndex = textComp.getCursorIndex(
                eventLocalPos[0],
                eventLocalPos[1]
            );
            this._currentText = textComp;
            const worldPos = this._setCursorDivPositionByIndex(cursorIndex);
            if (worldPos) {
                this._focusTextArea(
                    textComp,
                    worldPos,
                    cursorIndex,
                    cursorIndex
                );
            }
        }
    }

    public exitEditMode(): void {
        if (this._currentMode !== ResizeGizmoMode.EDIT) {
            return;
        }
        this._currentMode = ResizeGizmoMode.NONE;
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
                    this._hideTextArea!.style.left = worldPos[0] + 50 + 'px';
                    this._hideTextArea!.style.top = worldPos[1] + 'px';
                }, 100);
            }
            return worldPos;
        }
        return null;
    }
}
