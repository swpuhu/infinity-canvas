import { CanvasEditor } from '@/renderer/Editor';
import { SIArrow } from '@/renderer/RenderComponents/SIArrow';
import SNode from '@/renderer/SNode';
import { createElement } from '@/renderer/createElement';
import { createNodeFromConfig, refSNode } from '@/renderer/util';
import { vec2 } from 'gl-matrix';
import { SNodeConfig, SNodeEvents } from '@/common/types';
import eventBus from '@/common/eventBus';
import { CanvasEventSystem } from '@/renderer/SEventManager';
import { SGeo } from '@/renderer/Geometry/SGeo';

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

    constructor(private _editor: CanvasEditor) {
        const startRef = refSNode();
        const endRef = refSNode();
        const radius = 10;
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
        const width = direction === VERTICAL ? 10 : 20;
        const height = direction === VERTICAL ? 20 : 10;
        if (this._controls.length) {
            const control = this._controls.pop()!;
            // 激活并同步尺寸
            control.active = true;
            control.setSize(width, height);
            control.children.forEach((child) => child.setSize(width, height));
            this._attachControlEvents(control);
            this._usedControls.push(control);
            return control;
        }
        const controlConfig = (
            <container width={width} height={height}>
                <rect
                    width={width}
                    height={height}
                    style={{
                        fill: 0xcccccc,
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
            if (segLen < 50) {
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

        const worldPos = event.getWorldPosition();
        const arrowNode = this._currentArrow.node!;
        const localPos = arrowNode.toLocal(worldPos);
        this._dragStartLocal = [localPos[0], localPos[1]];

        // 备份原始点位
        const pts = this._currentArrow.getPoints();
        this._originPoints = pts.map((p) => [p[0], p[1]]);
        // 监听全局移动与抬起
        this._editor.eventSystem.addSystemEventListener(
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
        // 移动该段的两个端点
        const i = segmentIndex;
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

    private _onControlPointerUp = (_event: SNodeEvents.IPointerEvent) => {
        if (!this._dragging) return;
        console.log('control pointer up');
        this._dragging = false;
        this._dragControl = null;
        this._dragStartLocal = null;
        this._originPoints = [];
        // 移除系统监听
        this._editor.eventSystem.removeSystemEventListener(
            SNodeEvents.POINTER_MOVE,
            this._onControlPointerMove
        );
        this._editor.eventSystem.removeEventListener(
            this._editor.scene.rootNode,
            SNodeEvents.POINTER_UP,
            this._onControlPointerUp
        );
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
        points.forEach((node) =>
            CanvasEventSystem.instance.addEventListener(
                node,
                SNodeEvents.PURE_POINTER_MOVE,
                this._onPurePointerMove
            )
        );
    }

    private _onPurePointerMove = (event: SNodeEvents.IPointerEvent) => {
        event.stopPropagation();
        console.log('pure pointer move', event.currentTarget!.name);
        if (!this._currentArrow || !this._rootNode) return;
        const arrowNode = this._currentArrow.node!;
        const worldPos = event.getWorldPosition();
        const localPos = arrowNode.toLocal(worldPos);
        if (event.target !== this._prevHoveredNode) {
            this._onNodeHovered(this._prevHoveredNode, false);
            this._onNodeHovered(event.target, true);
        }

        this._prevHoveredNode = event.target;
    };

    private _onNodeHovered(node: SNode | null, isHover: boolean) {
        if (!node) {
            return;
        }
        const geo = node.getComponent(SGeo);
        if (geo && node === this._startPoint) {
            geo.fill({ color: isHover ? 0x000000 : 0xffffff });
        }
    }

    private _enableResize(): void {
        this._editor.eventSystem.addEventListener(
            this._editor.scene.getCanvasNode(),
            SNodeEvents.PURE_POINTER_MOVE,
            this._onPurePointerMove
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
