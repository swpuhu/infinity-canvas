import { CanvasEditor } from '@/renderer/Editor';
import { SIArrow } from '@/renderer/RenderComponents/SIArrow';
import SNode from '@/renderer/SNode';
import { createElement } from '@/renderer/createElement';
import { createNodeFromConfig, refSNode } from '@/renderer/util';
import { vec2, ReadonlyVec2 } from 'gl-matrix';
import { SNodeConfig, SNodeEvents } from '@/common/types';
import eventBus from '@/common/eventBus';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import { SGeo } from '@/renderer/Geometry/SGeo';
import { EditorMode, useEditorModeStore } from '@/store/EditorModeStore';
import { visitNodeRecursive } from '@/common/util';

const VERTICAL = 1;
const HORIZONTAL = 0;
type DIRECTION = typeof VERTICAL | typeof HORIZONTAL;

export class IArrowResizer {
    private _currentArrow: SIArrow | null = null;

    private _controls: SNode[] = [];

    private _usedControls: SNode[] = [];

    private _rootNode: SNode | null = null;

    private _prevHoveredNode: SNode | null = null;

    // drag state
    private _dragging = false;
    private _dragControl: SNode | null = null;
    private _dragStartLocal: [number, number] | null = null;
    private _originPoints: [number, number][] = [];

    private _startPoint: SNode | undefined = undefined;
    private _endPoint: SNode | undefined = undefined;

    private _registeredControls = new Set<string>();

    private _isDraggingEndPoint = false;
    private _draggingEndKind: 'start' | 'end' | null = null;
    private _isDraggingArrow = false;
    private _dragArrowStartWorld: [number, number] | null = null;
    private _arrowStartPos: [number, number] | null = null;
    private _controlsHiddenInDrag = false;

    private _lastSecondDir = VERTICAL;

    private _editorModeStore = useEditorModeStore();

    // 端点吸附状态
    private _endPointSnapped = false;
    private _snapToSegmentIndex = -1; // 吸附到的线段索引

    // 吸附阈值（可配置）
    private _snapThreshold: number = 10;
    // 合并阈值（像素）：用于判断线段长度是否近似为0
    private _mergeThreshold: number = 1;

    private _setControlsVisible(visible: boolean) {
        // 仅隐藏/显示分段控制点，不影响起点与终点
        this._usedControls.forEach((control) => {
            control.active = visible;
        });
    }

    private _updateEndpoints() {
        if (!this._currentArrow || !this._rootNode) return;
        const arrow = this._currentArrow;
        const points = arrow.getPoints();
        if (points.length < 2) return;
        const startWorldP = arrow.node!.toGlobal(points[0]);
        const endWorldP = arrow.node!.toGlobal(points[points.length - 1]);
        if (this._startPoint) {
            const localStartP = this._rootNode.toLocal(startWorldP);
            this._startPoint.position.set(localStartP[0], localStartP[1]);
        }
        if (this._endPoint) {
            const localEndP = this._rootNode.toLocal(endWorldP);
            this._endPoint.position.set(localEndP[0], localEndP[1]);
        }
    }

    constructor(
        private _editor: CanvasEditor,
        options?: { snapThreshold?: number }
    ) {
        if (options && typeof options.snapThreshold === 'number') {
            this._snapThreshold = options.snapThreshold;
        }
        const startRef = refSNode();
        const endRef = refSNode();
        const radius = 20;
        const rootConfig = (
            <container>
                <ellipse
                    name="start point"
                    ref={startRef}
                    width={radius}
                    height={radius}
                    style={{
                        fill: 0xffffff,
                        stroke: 0xff6600,
                    }}
                ></ellipse>
                <ellipse
                    name="end point"
                    ref={endRef}
                    width={radius}
                    height={radius}
                    style={{
                        fill: 0xffffff,
                        stroke: 0xff6600,
                    }}
                ></ellipse>
            </container>
        );
        this._rootNode = createNodeFromConfig(rootConfig);
        this._editor.scene.topLayer.addChild(this._rootNode);

        this._startPoint = startRef.value;
        this._endPoint = endRef.value;

        this._bindEvents();
        this._enableResize();
    }

    private _attachControlEvents(control: SNode) {
        if (this._registeredControls.has(control.uuid)) return;
        console.log('_attachControlEvents', control.name);
        this._editor.eventSystem.addEventListener(
            control,
            SNodeEvents.POINTER_DOWN,
            this._onControlPointerDown
        );
        CanvasEventSystem.instance.addEventListener(
            control,
            SNodeEvents.PURE_POINTER_MOVE,
            this._onPurePointerMove
        );

        this._registeredControls.add(control.uuid);
    }

    private _getNewControls(direction: DIRECTION): SNode {
        const width = direction === VERTICAL ? 20 : 50;
        const height = direction === VERTICAL ? 50 : 20;
        if (this._controls.length) {
            const control = this._controls.shift()!;
            // 激活并同步尺寸
            control.active = true;
            control.setSize(width, height);
            control.children.forEach((child) => child.setSize(width, height));
            // this._attachControlEvents(control);
            this._usedControls.push(control);
            return control;
        }
        const controlConfig = (
            <container
                width={width}
                height={height}
                name={'segmentControl' + this._usedControls.length}
            >
                <rect
                    width={width}
                    height={height}
                    style={{
                        fill: 0xffffff,
                        stroke: 0xff6600,
                    }}
                />
            </container>
        );
        const controlNode = createNodeFromConfig(controlConfig);
        this._attachControlEvents(controlNode);
        this._usedControls.push(controlNode);
        return controlNode;
    }

    public mountTo(arrow: SIArrow) {
        if (this._rootNode) {
            this._rootNode.active = true;
        }
        // console.log('mountToArrow', arrow);
        this._currentArrow = arrow;
        // 清理旧的控制节点
        this._clearControls();
        this._updateControls();
    }

    private _clearControls() {
        // 将当前使用的控制节点从rootNode中移除并回收到池中
        this._usedControls.forEach((control) => {
            if (control.parent) {
                control.parent.removeChild(control);
            }
            // 标记为非激活，避免从池中仍参与命中
            control.active = false;
        });
        this._controls.push(...this._usedControls);
        this._usedControls = [];
    }

    private _updateControls() {
        const arrow = this._currentArrow;
        if (!arrow) {
            return;
        }

        const points = arrow.getPoints();
        if (points.length < 2) {
            return;
        }

        const startPoint = points[0];
        const lastPoint = points[points.length - 1];
        const startWorldP = arrow.node!.toGlobal(startPoint);
        const endWorldP = arrow.node!.toGlobal(lastPoint);
        if (this._startPoint) {
            const localStartP = this._rootNode!.toLocal(startWorldP);
            this._startPoint.position.set(localStartP[0], localStartP[1]);
        }
        if (this._endPoint) {
            const localEndP = this._rootNode!.toLocal(endWorldP);
            this._endPoint.position.set(localEndP[0], localEndP[1]);
        }

        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            // 段长小于阈值则不创建控制点
            const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
            if (segLen < 100) {
                continue;
            }
            const midPoint = vec2.fromValues(
                (p1[0] + p2[0]) / 2,
                (p1[1] + p2[1]) / 2
            );
            const midWorldPoint = arrow.node!.toGlobal(midPoint);
            const isHorizontal =
                Math.abs(p1[0] - p2[0]) > Math.abs(p1[1] - p2[1]);
            const direction = isHorizontal ? HORIZONTAL : VERTICAL;
            const control = this._getNewControls(direction);
            const localPoint = this._rootNode!.toLocal(midWorldPoint);

            control.position.set(localPoint[0], localPoint[1]);
            // 记录对应的段索引（终点索引）与方向
            control.metadata.segmentIndex = i;
            control.metadata.direction = direction;

            this._rootNode?.addChild(control!);
        }
    }

    private _onControlPointerDown = (event: SNodeEvents.IPointerEvent) => {
        if (!this._currentArrow || !this._rootNode) return;
        const control = event.currentTarget!;
        const segmentIndex = control.metadata.segmentIndex as
            | number
            | undefined;
        if (segmentIndex === undefined) return;
        this._dragging = true;
        this._dragControl = control;
        event.stopPropagation();

        // 如果是首段或末段，且长度>100，则在该段中间插入两个点，并将当前控制段切换为新中段
        const pointsBefore = this._currentArrow.getPoints();
        if (
            (segmentIndex === 1 || segmentIndex === pointsBefore.length - 1) &&
            pointsBefore.length >= 2
        ) {
            const p1 = pointsBefore[segmentIndex - 1];
            const p2 = pointsBefore[segmentIndex];
            const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
            if (segLen > 100) {
                if (segmentIndex === 1) {
                    const dx = p2[0] - p1[0];
                    const dy = p2[1] - p1[1];
                    const pt1 = vec2.fromValues(
                        p1[0] + dx * 0.1,
                        p1[1] + dy * 0.1
                    );
                    const newPoints = pointsBefore.slice();
                    newPoints.splice(segmentIndex, 0, pt1, pt1);
                    this._currentArrow.setPoints(newPoints);
                    control.metadata.segmentIndex = segmentIndex + 2;
                } else {
                    const dx = p2[0] - p1[0];
                    const dy = p2[1] - p1[1];
                    const pt1 = vec2.fromValues(
                        p2[0] - dx * 0.1,
                        p2[1] - dy * 0.1
                    );
                    const newPoints = pointsBefore.slice();
                    newPoints.splice(segmentIndex, 0, pt1, pt1);
                    this._currentArrow.setPoints(newPoints);
                }
                // 将控制段改为新中段（pt1-pt2）
            }
        }

        const worldPos = event.getWorldPosition();
        const arrowNode = this._currentArrow.node!;
        const localPos = arrowNode.toLocal(worldPos);
        this._dragStartLocal = [localPos[0], localPos[1]];

        // 备份原始点位
        const ptsNow = this._currentArrow.getPoints();
        this._originPoints = ptsNow.map((p) => [p[0], p[1]]);
        // 监听全局移动与抬起
        this._editor.eventSystem.addEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.POINTER_MOVE,
            this._onControlPointerMove
        );
        // 注意：系统事件当前不派发 POINTER_UP，这里监听根节点的 POINTER_UP
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onControlPointerUp
        );
    };

    private _onControlPointerMove = (event: SNodeEvents.IPointerEvent) => {
        if (!this._dragging || !this._currentArrow || !this._dragControl)
            return;
        if (!this._controlsHiddenInDrag) {
            this._setControlsVisible(false);
            this._controlsHiddenInDrag = true;
        }
        const segmentIndex = this._dragControl.metadata.segmentIndex as number;
        const direction = this._dragControl.metadata.direction as
            | DIRECTION
            | undefined;
        const arrowNode = this._currentArrow.node!;

        const worldPos = event.getWorldPosition();
        const localPos = arrowNode.toLocal(worldPos);
        const start = this._dragStartLocal!;
        let dx = localPos[0] - start[0];
        let dy = localPos[1] - start[1];

        // 方向约束：水平段仅允许竖直移动；竖直段仅允许水平移动
        if (direction === HORIZONTAL) {
            dx = 0;
        } else if (direction === VERTICAL) {
            dy = 0;
        }

        const newPoints = this._originPoints.map(
            (p) => [p[0], p[1]] as [number, number]
        );

        // 计算移动后的临时点位
        const tempPoints = [...newPoints];
        const i = segmentIndex;
        tempPoints[i - 1] = [
            this._originPoints[i - 1][0] + dx,
            this._originPoints[i - 1][1] + dy,
        ];
        tempPoints[i] = [
            this._originPoints[i][0] + dx,
            this._originPoints[i][1] + dy,
        ];

        // 吸附逻辑：检查与前后第二个线段是否共线
        let snapOffset = 0;

        // 检查前面第二个线段（如果存在）
        if (i >= 3) {
            // 确保前面有足够的点
            const beforeSecondSegmentStart = tempPoints[i - 3];
            const beforeSecondSegmentEnd = tempPoints[i - 2];

            // 计算前面第二个线段的方向
            const beforeSecondDir = this._getSegmentDirection(
                beforeSecondSegmentStart,
                beforeSecondSegmentEnd
            );

            // 如果方向相同，进行吸附检查
            if (beforeSecondDir === direction) {
                if (direction === HORIZONTAL) {
                    // 水平线段，检查Y坐标
                    const beforeSecondY = beforeSecondSegmentStart[1];
                    const currentY = tempPoints[i - 1][1];
                    const distance = Math.abs(currentY - beforeSecondY);
                    if (distance < this._snapThreshold) {
                        snapOffset = beforeSecondY - currentY;
                    }
                } else if (direction === VERTICAL) {
                    // 垂直线段，检查X坐标
                    const beforeSecondX = beforeSecondSegmentStart[0];
                    const currentX = tempPoints[i - 1][0];
                    const distance = Math.abs(currentX - beforeSecondX);
                    if (distance < this._snapThreshold) {
                        snapOffset = beforeSecondX - currentX;
                    }
                }
            }
        }

        // 检查后面第二个线段（如果存在）
        if (snapOffset === 0 && i + 2 < tempPoints.length) {
            // 确保后面有足够的点
            const afterSecondSegmentStart = tempPoints[i + 1];
            const afterSecondSegmentEnd = tempPoints[i + 2];

            // 计算后面第二个线段的方向
            const afterSecondDir = this._getSegmentDirection(
                afterSecondSegmentStart,
                afterSecondSegmentEnd
            );

            // 如果方向相同，进行吸附检查
            if (afterSecondDir === direction) {
                if (direction === HORIZONTAL) {
                    // 水平线段，检查Y坐标
                    const afterSecondY = afterSecondSegmentStart[1];
                    const currentY = tempPoints[i - 1][1];
                    const distance = Math.abs(currentY - afterSecondY);
                    if (distance < this._snapThreshold) {
                        snapOffset = afterSecondY - currentY;
                    }
                } else if (direction === VERTICAL) {
                    // 垂直线段，检查X坐标
                    const afterSecondX = afterSecondSegmentStart[0];
                    const currentX = tempPoints[i - 1][0];
                    const distance = Math.abs(currentX - afterSecondX);
                    if (distance < this._snapThreshold) {
                        snapOffset = afterSecondX - currentX;
                    }
                }
            }
        }

        // 应用吸附偏移
        if (snapOffset !== 0) {
            if (direction === HORIZONTAL) {
                dy += snapOffset;
            } else if (direction === VERTICAL) {
                dx += snapOffset;
            }
        }

        // 移动该段的两个端点
        newPoints[i - 1] = [
            this._originPoints[i - 1][0] + dx,
            this._originPoints[i - 1][1] + dy,
        ];
        newPoints[i] = [
            this._originPoints[i][0] + dx,
            this._originPoints[i][1] + dy,
        ];

        this._currentArrow.setPoints(newPoints);

        // 更新当前控制点位置到新中点
        const p1 = newPoints[i - 1];
        const p2 = newPoints[i];
        const midPoint = vec2.fromValues(
            (p1[0] + p2[0]) / 2,
            (p1[1] + p2[1]) / 2
        );
        const midWorldPoint = arrowNode.toGlobal(midPoint);
        const localPoint = this._rootNode!.toLocal(midWorldPoint);
        this._dragControl.position.set(localPoint[0], localPoint[1]);

        eventBus.reDraw();
    };

    // 对外提供阈值设置
    public setSnapThreshold(value: number) {
        this._snapThreshold = value;
    }

    private _getSegmentDirection(
        start: [number, number],
        end: [number, number]
    ): DIRECTION {
        const dx = Math.abs(end[0] - start[0]);
        const dy = Math.abs(end[1] - start[1]);
        return dx > dy ? HORIZONTAL : VERTICAL;
    }

    private _onControlPointerUp = (_event: SNodeEvents.IPointerEvent) => {
        if (!this._dragging) return;
        console.log('control pointer up');
        // 在清理拖拽状态前尝试进行相邻线段合并
        if (this._currentArrow && this._dragControl) {
            const segIndex =
                (this._dragControl.metadata.segmentIndex as number) || 0;
            this._mergeNearZeroSegmentsAround(segIndex);
        }

        this._dragging = false;
        this._dragControl = null;
        this._dragStartLocal = null;
        this._originPoints = [];
        // 移除系统监听
        this._editor.eventSystem.removeEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.POINTER_MOVE,
            this._onControlPointerMove
        );
        this._editor.eventSystem.removeEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onControlPointerUp
        );
        // 拖拽结束后重建控制点并显示
        this._clearControls();
        this._updateControls();
        this._controlsHiddenInDrag = false;
    };
    // 合并当前控制段相邻、长度近似为0的线段
    private _mergeNearZeroSegmentsAround(segmentIndex: number): void {
        if (!this._currentArrow) return;
        const points = this._currentArrow
            .getPoints()
            .map((p) => [p[0], p[1]] as [number, number]);
        if (points.length < 3) return; // 少于3个点不能合并

        // segmentIndex 表示被控制的线段是 [i-1] -> [i]
        let i = segmentIndex;
        let changed = false;

        const dist = (a: [number, number], b: [number, number]) => {
            const dx = a[0] - b[0];
            const dy = a[1] - b[1];
            return Math.hypot(dx, dy);
        };

        // 检查并删除长度近似为0的线段
        // 检查前一条线段：points[i-2] -> points[i-1]
        if (i - 2 >= 0) {
            const dPrev = dist(points[i - 2], points[i - 1]);
            if (dPrev <= this._mergeThreshold) {
                // 删除 points[i-1]，使得 [i-2] 直接连接到 [i]
                points.splice(i - 1, 1);
                i -= 1; // 被控制的段索引左移
                changed = true;
            }
        }

        // 检查后一条线段：points[i] -> points[i+1]
        if (i + 1 < points.length - 1) {
            const dNext = dist(points[i], points[i + 1]);
            if (dNext <= this._mergeThreshold) {
                // 删除 points[i]，使得 [i-1] 直接连接到 [i+1]
                points.splice(i, 1);
                changed = true;
            }
        }

        // 删除操作完成后，进一步检查是否有可合并的共线线段
        if (changed) {
            this._mergeCollinearSegments(points);
            this._currentArrow.setPoints(points);
            eventBus.reDraw();
        }
    }

    // 合并共线线段：删除共线中间点
    private _mergeCollinearSegments(points: [number, number][]): void {
        if (points.length < 3) return;

        // 判断三点是否共线的辅助函数
        const areCollinear = (
            p1: [number, number],
            p2: [number, number],
            p3: [number, number]
        ): boolean => {
            // 使用叉积判断共线：(p2-p1) × (p3-p1) = 0
            const v1x = p2[0] - p1[0];
            const v1y = p2[1] - p1[1];
            const v2x = p3[0] - p1[0];
            const v2y = p3[1] - p1[1];
            const crossProduct = Math.abs(v1x * v2y - v1y * v2x);
            // 使用小的阈值判断是否近似共线
            return crossProduct < 0.1;
        };

        let i = 1;
        while (i < points.length - 1) {
            if (areCollinear(points[i - 1], points[i], points[i + 1])) {
                // 中间点可以被删除，因为三点共线
                points.splice(i, 1);
                // 不递增i，因为删除后需要重新检查当前位置
            } else {
                i++;
            }
        }
    }

    private _onEndPointPointerDown = (event: SNodeEvents.IPointerEvent) => {
        if (!this._currentArrow || !this._rootNode) return;
        this._isDraggingEndPoint = true;
        this._draggingEndKind =
            event.currentTarget === this._startPoint ? 'start' : 'end';
        event.stopPropagation();

        // 重置吸附状态
        this._endPointSnapped = false;
        this._snapToSegmentIndex = -1;

        this._editor.eventSystem.addEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.POINTER_MOVE,
            this._onEndPointerMove
        );
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onEndPointPointerUp
        );

        const points = this._currentArrow.getPoints();
        if (this._draggingEndKind === 'start') {
            const isHorizontal =
                Math.abs(points[1][0] - points[2][0]) >
                Math.abs(points[1][1] - points[2][1]);
            this._lastSecondDir = isHorizontal ? HORIZONTAL : VERTICAL;
        } else {
            const last = points.length - 1;
            const isHorizontal =
                Math.abs(points[last - 1][0] - points[last - 2][0]) >
                Math.abs(points[last - 1][1] - points[last - 2][1]);
            this._lastSecondDir = isHorizontal ? HORIZONTAL : VERTICAL;
        }
        console.log('lastSecondDir', this._lastSecondDir);
    };

    private _onEndPointerMove = (event: SNodeEvents.IPointerEvent) => {
        if (!this._isDraggingEndPoint) {
            return;
        }
        if (!this._controlsHiddenInDrag) {
            this._setControlsVisible(false);
            this._controlsHiddenInDrag = true;
        }
        if (!this._currentArrow || !this._rootNode) return;
        const arrowNode = this._currentArrow.node!;
        const worldPos = event.getWorldPosition();
        const localPos = arrowNode.toLocal(worldPos);

        if (this._draggingEndKind === 'start') {
            this._handleStartPointMove(localPos, worldPos);
        } else if (this._draggingEndKind === 'end') {
            this._handleEndPointMove(localPos, worldPos);
        }

        eventBus.reDraw();
    };

    private _handleStartPointMove(
        localPos: ReadonlyVec2,
        worldPos: ReadonlyVec2
    ) {
        const points = this._currentArrow!.getPoints().map(
            (p) => [p[0], p[1]] as [number, number]
        );
        const arrowNode = this._currentArrow!.node!;

        points[0] = [localPos[0], localPos[1]];

        // 检查对第二条线段的吸附（如果存在）
        let snapInfo = null;
        if (points.length >= 3) {
            snapInfo = this._checkSnapToSegment(
                points[0],
                points[1],
                points[2],
                1
            );
        }

        if (snapInfo) {
            // 吸附到第二条线段
            this._endPointSnapped = true;
            this._snapToSegmentIndex = 1;

            // 调整起始点到投影位置
            points[0] = snapInfo.projectedPoint;

            // 第二个控制点跟随移动
            this._moveFollowingControlPoint(points, 0, snapInfo);
        } else {
            // 检查是否脱离吸附
            if (this._endPointSnapped && this._snapToSegmentIndex === 1) {
                this._endPointSnapped = false;
                this._snapToSegmentIndex = -1;
            }

            // 原有逻辑：根据方向调整第二个点
            if (!this._currentArrow!.isOrigin) {
                if (this._lastSecondDir === HORIZONTAL) {
                    points[1][0] = points[0][0];
                } else {
                    points[1][1] = points[0][1];
                }
            }
        }

        // 更新箭头点和UI
        if (this._currentArrow!.isOrigin) {
            this._currentArrow!.setPoints([
                points[0],
                points[points.length - 1],
            ]);
        } else {
            this._currentArrow!.setPoints(points);
        }

        // 让端点控制柄显示在实际吸附后的端点位置
        const snappedWorld = arrowNode.toGlobal(
            vec2.fromValues(points[0][0], points[0][1])
        );
        const lp = this._rootNode!.toLocal(snappedWorld);
        this._startPoint && this._startPoint.position.set(lp[0], lp[1]);
    }

    private _handleEndPointMove(
        localPos: ReadonlyVec2,
        worldPos: ReadonlyVec2
    ) {
        const points = this._currentArrow!.getPoints().map(
            (p) => [p[0], p[1]] as [number, number]
        );
        const arrowNode = this._currentArrow!.node!;

        const last = points.length - 1;
        points[last] = [localPos[0], localPos[1]];

        // 检查对倒数第二条线段的吸附（如果存在）
        let snapInfo = null;
        if (points.length >= 3) {
            snapInfo = this._checkSnapToSegment(
                points[last],
                points[last - 1],
                points[last - 2],
                last - 1
            );
        }

        if (snapInfo) {
            // 吸附到倒数第二条线段
            this._endPointSnapped = true;
            this._snapToSegmentIndex = last - 1;

            // 调整终点到投影位置
            points[last] = snapInfo.projectedPoint;

            // 倒数第二个控制点跟随移动
            this._moveFollowingControlPoint(points, last, snapInfo);
        } else {
            // 检查是否脱离吸附
            if (
                this._endPointSnapped &&
                this._snapToSegmentIndex === last - 1
            ) {
                this._endPointSnapped = false;
                this._snapToSegmentIndex = -1;
            }

            // 原有逻辑：根据方向调整倒数第二个点
            if (!this._currentArrow!.isOrigin) {
                if (this._lastSecondDir === HORIZONTAL) {
                    points[last - 1][0] = points[last][0];
                } else {
                    points[last - 1][1] = points[last][1];
                }
            }
        }

        // 更新箭头点和UI
        if (this._currentArrow!.isOrigin) {
            this._currentArrow!.setPoints([
                points[0],
                points[points.length - 1],
            ]);
        } else {
            this._currentArrow!.setPoints(points);
        }

        // 让端点控制柄显示在实际吸附后的端点位置
        const snappedWorld = arrowNode.toGlobal(
            vec2.fromValues(points[last][0], points[last][1])
        );
        const lp = this._rootNode!.toLocal(snappedWorld);
        this._endPoint && this._endPoint.position.set(lp[0], lp[1]);
    }

    // 检查点是否应该吸附到指定线段
    private _checkSnapToSegment(
        endPoint: [number, number],
        adjacentPoint: [number, number],
        targetPoint: [number, number],
        segmentIndex: number
    ): { projectedPoint: [number, number]; isOnSegment: boolean } | null {
        if (!this._currentArrow || !this._rootNode) return null;
        const arrowNode = this._currentArrow.node!;

        // 将点转换到屏幕（_rootNode）坐标系，使用像素级阈值
        const endWorld = arrowNode.toGlobal(
            vec2.fromValues(endPoint[0], endPoint[1])
        );
        const segStartWorld = arrowNode.toGlobal(
            vec2.fromValues(adjacentPoint[0], adjacentPoint[1])
        );
        const segEndWorld = arrowNode.toGlobal(
            vec2.fromValues(targetPoint[0], targetPoint[1])
        );

        const endScreen = this._rootNode.toLocal(endWorld);
        const segStartScreen = this._rootNode.toLocal(segStartWorld);
        const segEndScreen = this._rootNode.toLocal(segEndWorld);

        const distance = this._pointToSegmentDistance(
            [endScreen[0], endScreen[1]],
            [segStartScreen[0], segStartScreen[1]],
            [segEndScreen[0], segEndScreen[1]]
        );

        console.log('Snap check (screen):', {
            endScreen: [endScreen[0], endScreen[1]],
            segStartScreen: [segStartScreen[0], segStartScreen[1]],
            segEndScreen: [segEndScreen[0], segEndScreen[1]],
            distance: distance.distance,
            threshold: this._snapThreshold,
            shouldSnap: distance.distance <= this._snapThreshold,
            segmentIndex,
        });

        if (distance.distance <= this._snapThreshold) {
            // 将屏幕坐标下的投影点转换回箭头局部坐标
            const projectionWorld = this._rootNode.toGlobal(
                vec2.fromValues(distance.projection[0], distance.projection[1])
            );
            const projectedLocal = arrowNode.toLocal(projectionWorld);
            return {
                projectedPoint: [projectedLocal[0], projectedLocal[1]],
                isOnSegment: distance.isOnSegment,
            };
        }

        return null;
    }

    // 计算点到线段的距离和投影点
    private _pointToSegmentDistance(
        point: [number, number],
        segStart: [number, number],
        segEnd: [number, number]
    ): {
        distance: number;
        projection: [number, number];
        isOnSegment: boolean;
    } {
        const dx = segEnd[0] - segStart[0];
        const dy = segEnd[1] - segStart[1];
        const segmentLengthSq = dx * dx + dy * dy;

        if (segmentLengthSq === 0) {
            // 线段退化为点
            const dist = Math.hypot(
                point[0] - segStart[0],
                point[1] - segStart[1]
            );
            return {
                distance: dist,
                projection: [segStart[0], segStart[1]],
                isOnSegment: true,
            };
        }

        // 计算投影参数 t
        const t = Math.max(
            0,
            Math.min(
                1,
                ((point[0] - segStart[0]) * dx +
                    (point[1] - segStart[1]) * dy) /
                    segmentLengthSq
            )
        );

        // 投影点
        const projection: [number, number] = [
            segStart[0] + t * dx,
            segStart[1] + t * dy,
        ];

        // 距离
        const distance = Math.hypot(
            point[0] - projection[0],
            point[1] - projection[1]
        );

        return {
            distance,
            projection,
            isOnSegment: t > 0 && t < 1,
        };
    }

    // 在吸附状态下移动跟随控制点
    private _moveFollowingControlPoint(
        points: [number, number][],
        endPointIndex: number,
        snapInfo: { projectedPoint: [number, number]; isOnSegment: boolean }
    ) {
        if (endPointIndex === 0) {
            // 起始点的情况：移动第二个控制点
            if (points.length >= 2) {
                const followingIndex = 1;
                // 保持与起始点的相对方向关系
                if (this._lastSecondDir === HORIZONTAL) {
                    points[followingIndex][0] = points[0][0];
                } else {
                    points[followingIndex][1] = points[0][1];
                }
            }
        } else {
            // 终点的情况：移动倒数第二个控制点
            const followingIndex = endPointIndex - 1;
            if (followingIndex >= 0) {
                // 保持与终点的相对方向关系
                if (this._lastSecondDir === HORIZONTAL) {
                    points[followingIndex][0] = points[endPointIndex][0];
                } else {
                    points[followingIndex][1] = points[endPointIndex][1];
                }
            }
        }
    }

    private _onEndPointPointerUp = (event: SNodeEvents.IPointerEvent) => {
        if (!this._isDraggingEndPoint) {
            return;
        }
        this._isDraggingEndPoint = false;
        this._draggingEndKind = null;

        // 重置吸附状态
        this._endPointSnapped = false;
        this._snapToSegmentIndex = -1;

        event.stopPropagation();

        this._editor.eventSystem.removeEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.POINTER_MOVE,
            this._onEndPointerMove
        );
        this._editor.eventSystem.removeEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onEndPointPointerUp
        );
        // 拖拽结束后重建控制点并显示
        this._clearControls();
        this._updateControls();
        this._controlsHiddenInDrag = false;
    };

    private _onCanvasPointerDown = (event: SNodeEvents.IPointerEvent) => {
        if (!this._rootNode) return;
        if (this._isDraggingEndPoint || this._dragging) return;
        const worldPos = event.getWorldPosition();
        // 支持直接点击线段开始拖拽：若当前无箭头，尝试拾取
        if (!this._currentArrow) {
            const picked = this._pickArrowAt(worldPos);
            if (picked) {
                this.mountTo(picked);
            }
        }
        // 点击在箭头线段上才开始整体拖拽
        if (!this._currentArrow || !this._currentArrow.hitTest(worldPos))
            return;

        this._isDraggingArrow = true;
        this._dragArrowStartWorld = [worldPos[0], worldPos[1]];
        const arrowNode = this._currentArrow.node!;
        this._arrowStartPos = [arrowNode.position.x, arrowNode.position.y];
        event.stopPropagation();

        this._editor.eventSystem.addEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.POINTER_MOVE,
            this._onCanvasPointerMoveArrow
        );
        this._editor.eventSystem.addEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onCanvasPointerUpArrow
        );
    };

    private _pickArrowAt(worldPos: ReadonlyVec2): SIArrow | null {
        let picked: SIArrow | null = null;
        visitNodeRecursive(this._editor.scene.rootNode, (node) => {
            if (picked) return;
            const arrow = node.getComponent(SIArrow);
            if (arrow && arrow.hitTest(worldPos)) {
                picked = arrow;
            }
        });
        return picked;
    }

    private _onCanvasPointerMoveArrow = (event: SNodeEvents.IPointerEvent) => {
        if (
            !this._isDraggingArrow ||
            !this._currentArrow ||
            !this._dragArrowStartWorld ||
            !this._arrowStartPos
        )
            return;
        if (!this._controlsHiddenInDrag) {
            this._setControlsVisible(false);
            this._controlsHiddenInDrag = true;
        }
        const arrowNode = this._currentArrow.node!;
        const parentNode = arrowNode.parent!;
        const currWorld = event.getWorldPosition();

        const startLocal = parentNode.toLocal(this._dragArrowStartWorld);
        const currLocal = parentNode.toLocal(currWorld);
        const dx = currLocal[0] - startLocal[0];
        const dy = currLocal[1] - startLocal[1];
        arrowNode.position.set(
            this._arrowStartPos[0] + dx,
            this._arrowStartPos[1] + dy
        );

        // 同步更新起点/终点位置，但保持控制点隐藏
        this._updateEndpoints();
        eventBus.reDraw();
    };

    private _onCanvasPointerUpArrow = (event: SNodeEvents.IPointerEvent) => {
        if (!this._isDraggingArrow) return;
        this._isDraggingArrow = false;
        this._dragArrowStartWorld = null;
        this._arrowStartPos = null;
        event.stopPropagation();

        this._editor.eventSystem.removeEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.POINTER_MOVE,
            this._onCanvasPointerMoveArrow
        );
        this._editor.eventSystem.removeEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onCanvasPointerUpArrow
        );
        // 拖拽结束后重建控制点并显示
        this._clearControls();
        this._updateControls();
        this._controlsHiddenInDrag = false;
    };

    public unMount() {
        if (this._rootNode) {
            this._rootNode.active = false;
        }
        this._currentArrow = null;
        // 正确清理控制节点
        this._clearControls();
    }

    private _bindEvents(): void {
        const points = [this._startPoint!, this._endPoint!];
        points.forEach((node) => {
            CanvasEventSystem.instance.addEventListener(
                node,
                SNodeEvents.PURE_POINTER_MOVE,
                this._onPurePointerMove
            );
            this._editor.eventSystem.addEventListener(
                node,
                SNodeEvents.POINTER_DOWN,
                this._onEndPointPointerDown
            );
        });
    }

    private _onPurePointerMove = (event: SNodeEvents.IPointerEvent) => {
        event.stopPropagation();
        if (this._isDraggingEndPoint) {
            return;
        }

        if (!this._currentArrow || !this._rootNode) return;
        if (event.currentTarget !== this._prevHoveredNode) {
            this._onNodeHovered(this._prevHoveredNode, false);
            this._onNodeHovered(event.target, true);
        }

        this._prevHoveredNode = event.target;
    };

    private _onNodeHovered(node: SNode | null, isHover: boolean) {
        if (!node) {
            return;
        }
        console.log('hovered: ', isHover, node.name);
        const geo =
            node.getComponent(SGeo) || node.getComponentInChildren(SGeo);

        if (this._usedControls.includes(node)) {
            geo && geo.fill({ color: isHover ? 0xff6600 : 0xffffff });
            this._editorModeStore.setMode(
                isHover ? EditorMode.PRE_RESIZE_ARROW : EditorMode.DEFAULT,
                node.metadata.direction === VERTICAL ? 'ew' : 'ns'
            );
        } else if (node === this._startPoint || node === this._endPoint) {
            geo && geo.fill({ color: isHover ? 0xff6600 : 0xffffff });
            this._editorModeStore.setMode(
                isHover ? EditorMode.PRE_MOVE_ARROW : EditorMode.DEFAULT
            );
        } else {
            this._editorModeStore.setMode(EditorMode.DEFAULT);
        }
    }

    private _enableResize(): void {
        this._editor.eventSystem.addEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.PURE_POINTER_MOVE,
            this._onPurePointerMove
        );
        this._editor.eventSystem.addEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.POINTER_DOWN,
            this._onCanvasPointerDown
        );
    }

    destroy(): void {
        this.unMount();
        // 彻底移除root容器，避免空容器常驻
        if (this._rootNode) {
            this._rootNode.removeChildren();
            this._rootNode.removeFromParent();
            this._rootNode = null;
        }
        // 清理池与引用
        this._controls = [];
        this._usedControls = [];
        this._currentArrow = null;
    }
}
