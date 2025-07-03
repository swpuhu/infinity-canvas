import { EventNames, SNodeEvents } from '@/common/types';
import { CanvasEditor } from '@/renderer/Editor';
import SNode from '@/renderer/SNode';
import { createNodeFromConfig } from '@/renderer/util';
import EventEmitter from 'eventemitter3';
import { ReadonlyVec2, vec2 } from 'gl-matrix';
import { SelectUI } from './SelectUI';
import { createElement } from '@/renderer/createElement';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';

export class SelectEventsHandler extends EventEmitter {
    private _selectedNodes: SNode[] = [];
    private _isEnabled = false;
    private _ui: SNode;

    private _startPos: ReadonlyVec2 = vec2.create();

    private _editorModeStore = useEditorModeStore();
    constructor(private _editor: CanvasEditor) {
        super();
        this._ui = createNodeFromConfig(
            <SelectUI fill={0xffbbcc55} stroke={0xff0000cc} strokeWidth={1} />
        );
        this._editor.scene.topLayer.addChild(this._ui);
        this._enableSelect();
    }
    public selectStart = (event: SNodeEvents.IPointerEvent): void => {
        event.stopPropagation();
        const currentMode = this._editorModeStore.currentMode;
        if (currentMode !== EditorMode.DEFAULT) {
            return;
        }
        if (event.button === 2) {
            return;
        }
        this._isEnabled = true;
        this._showUI();
        const localPos = event.getLocalPosition(this._ui.parent!);
        this._startPos = localPos;
    };

    private _onSelectPointerMove = (event: SNodeEvents.IPointerEvent): void => {
        if (!this._isEnabled) {
            return;
        }
        this._ui.active = true;
        let currentPos = event.getLocalPosition(this._ui.parent!);

        this._ui.width = Math.abs(currentPos[0] - this._startPos[0]);
        this._ui.height = Math.abs(currentPos[1] - this._startPos[1]);

        let x = this._startPos[0];
        let y = this._startPos[1];

        if (currentPos[0] < this._startPos[0]) {
            x = currentPos[0];
        }

        if (currentPos[1] < this._startPos[1]) {
            y = currentPos[1];
        }

        this._ui.position.set(x, y, true);
    };

    private _onSelectPointerUp = (event: SNodeEvents.IPointerEvent): void => {
        const currentMode = this._editorModeStore.currentMode;
        if (currentMode !== EditorMode.DEFAULT) {
            return;
        }
        this._isEnabled = false;

        // 如果选框太小，认为是点击而非拖拽，不执行框选
        if (this._ui.width < 5 || this._ui.height < 5) {
            this._hideUI();
            return;
        }

        // 获取选框的世界坐标边界
        // 将选框的四个角转换到世界坐标系
        const topLeft = this._ui.toGlobal([0, 0]);
        const bottomRight = this._ui.toGlobal([
            this._ui.width,
            this._ui.height,
        ]);

        const selectRect = {
            x: topLeft[0],
            y: topLeft[1],
            width: bottomRight[0] - topLeft[0],
            height: bottomRight[1] - topLeft[1],
            right: bottomRight[0],
            bottom: bottomRight[1],
        };

        // 清空之前选中的节点
        this._selectedNodes = [];

        // 遍历场景中的节点，检查是否与选框相交
        this._findIntersectingNodes(
            this._editor.scene.getAllNodes(),
            selectRect
        );

        this._hideUI();

        this.emit(EventNames.DRAG_SELECT_END, this._selectedNodes);
    };

    // 递归检查节点及其子节点是否与选框相交
    private _findIntersectingNodes(
        nodes: ReadonlyArray<SNode>,
        selectRect: {
            x: number;
            y: number;
            width: number;
            height: number;
            right: number;
            bottom: number;
        }
    ): void {
        // 跳过选框UI自身
        for (const node of nodes) {
            if (node === this._ui) {
                continue;
            }

            // 跳过不可见的节点
            if (!node.active) {
                continue;
            }
            // 检查节点是否与选框相交
            if (this._isNodeIntersectingWithRect(node, selectRect)) {
                this._selectedNodes.push(node);
            }
        }
    }

    // 检查节点是否与选框相交
    private _isNodeIntersectingWithRect(
        node: SNode,
        selectRect: {
            x: number;
            y: number;
            width: number;
            height: number;
            right: number;
            bottom: number;
        }
    ): boolean {
        // 获取节点的世界坐标边界
        const worldPoints = node.getWorldPoints();

        // 找出节点边界的最小和最大坐标
        let minX = Infinity,
            minY = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity;

        for (const point of worldPoints) {
            minX = Math.min(minX, point[0]);
            minY = Math.min(minY, point[1]);
            maxX = Math.max(maxX, point[0]);
            maxY = Math.max(maxY, point[1]);
        }

        // 检查节点边界是否与选框相交
        // 两个矩形相交的条件：一个矩形的右边界大于另一个的左边界，且一个的下边界大于另一个的上边界
        const intersects =
            maxX >= selectRect.x &&
            minX <= selectRect.right &&
            maxY >= selectRect.y &&
            minY <= selectRect.bottom;

        return intersects;
    }

    private _showUI(): void {
        this._ui.active = true;
    }

    private _hideUI(): void {
        this._ui.active = false;
        this._ui.width = 0;
        this._ui.height = 0;
    }

    private _enableSelect(): void {
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_MOVE,
            this._onSelectPointerMove
        );
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onSelectPointerUp
        );
    }

    public getSelectedNodes(): SNode[] {
        return this._selectedNodes;
    }
}
