import { nodePool } from '@/common/NodePool';
import { Pool } from '@/common/Pool';
import eventBus from '@/common/eventBus';
import {
    ISegment,
    IPointData,
    SNodeConfig,
    SNodeEvents,
    ILine,
    Vec2Like,
} from '@/common/types';
import { CanvasEditor } from '../Editor';
import SNode from '../SNode';
import { createElement } from '../createElement';
import {
    createNodeFromConfig,
    getRectByNode,
    getWorldRect,
    refSNode,
} from '../util';
import { HORIZONTAL_VEC, VERTICAL_VEC } from '@/common/const';
import { ReadonlyVec2 } from 'gl-matrix';
import { getDistance } from '@/common/util';

export class SnapGuide {
    private _rootRef: SNodeConfig.IRefSNode = refSNode();

    private _nodePool: Pool<SNode> = nodePool;

    private _containerRef: SNodeConfig.IRefSNode = refSNode();

    private _dashLineRefs: SNodeConfig.IRefSNode[] = [];

    constructor(private _editor: CanvasEditor) {
        this._rootRef.value = this._createNode();
        console.log(this._dashLineRefs);
        this._editor.scene.topLayer.addChild(this._rootRef.value);
    }

    private _createNode(): SNode {
        return createNodeFromConfig(
            <container ref={this._containerRef}>
                {Array.from({ length: 4 }).map((_, index) => {
                    const ref = refSNode();
                    this._dashLineRefs.push(ref);
                    return (
                        <dash-line
                            ref={ref}
                            transform={{
                                anchor: { x: 0, y: 0.5 },
                                position: {
                                    x: 0,
                                    y: index * 50,
                                },
                            }}
                            width={100}
                            height={1}
                            style={{
                                strokeWidth: 1,
                                stroke: 0xff0000,
                                alpha: 1,
                            }}
                        />
                    );
                })}
            </container>
        );
    }

    public hideGuides(): void {
        const root = this._rootRef.value;
        if (!root) {
            return;
        }
        root.active = false;
    }

    public showGuides(lines: ISegment[]): void {
        const root = this._rootRef.value;
        if (!root) {
            return;
        }

        // Hide all dash lines first
        this._dashLineRefs.forEach((ref) => {
            if (ref.value) {
                ref.value.active = false;
            }
        });

        // Show only the necessary dash lines based on input
        lines.forEach((line, index) => {
            if (index >= this._dashLineRefs.length) return;

            const dashLine = this._dashLineRefs[index].value;
            if (!dashLine) return;

            // Calculate the length and angle of the line
            const dx = line.end.x - line.start.x;
            const dy = line.end.y - line.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Convert world coordinates to local coordinates
            const startLocal = root.toLocal([line.start.x, line.start.y]);

            // 判断是水平线还是垂直线
            const isHorizontal = Math.abs(angle) < 45 || Math.abs(angle) > 135;

            // Update dash line properties
            dashLine.width = length;

            // 根据线条类型设置正确的变换
            if (isHorizontal) {
                // 水平线，确保正确显示
                dashLine.setTransform({
                    position: { x: startLocal[0], y: startLocal[1] },
                    rotation: 0,
                    anchor: { x: 0, y: 0.5 }, // 确保水平线的锚点在线的中心
                });
                eventBus.reDraw();
            } else {
                // 垂直线

                dashLine.setTransform({
                    position: { x: startLocal[0], y: startLocal[1] },
                    rotation: 90,
                    anchor: { x: 0, y: 0 }, // 垂直线可以保持锚点在顶部
                });
            }

            dashLine.active = true;
        });

        // Make the root node active
        root.active = true;
    }

    public fixEventWorldPosition(
        worldPosition: Vec2Like,
        excludeNodes: SNode[]
    ) {
        const otherPoints = this._collectPoints(excludeNodes);
        const srcWorldPoint = worldPosition;
        const fixedWorldPosition = worldPosition.slice();
        for (let j = 0; j < otherPoints.length; j++) {
            const otherPoint = otherPoints[j];
            // const dist = getDistance(srcWorldPoint as ReadonlyVec2, otherPoint);

            // if (dist < 10) {
            //     const dir = [
            //         otherPoint[0] - srcWorldPoint[0],
            //         otherPoint[1] - srcWorldPoint[1],
            //     ];
            //     fixedWorldPosition[0] += dir[0];
            //     fixedWorldPosition[1] += dir[1];
            // }

            /**
             * 在这后面继续生成代码：
             * 继续判断otherPoint所在的水平线段与垂直线段 与 srcWorldPoint的距离
             * 如果距离小于10，则将srcWorldPoint移动到该线段上
             * 如果距离大于10，则不进行移动
             */

            // 检查与通过otherPoint的水平线的距离
            const horizontalLineDist = Math.abs(
                srcWorldPoint[1] - otherPoint[1]
            );
            if (horizontalLineDist < 10) {
                // 将srcWorldPoint投影到水平线上（只修改Y坐标）
                const horizontalOffset = otherPoint[1] - srcWorldPoint[1];
                fixedWorldPosition[1] += horizontalOffset;
            }

            // 检查与通过otherPoint的垂直线的距离
            const verticalLineDist = Math.abs(srcWorldPoint[0] - otherPoint[0]);
            if (verticalLineDist < 10) {
                // 将srcWorldPoint投影到垂直线上（只修改X坐标）
                const verticalOffset = otherPoint[0] - srcWorldPoint[0];
                fixedWorldPosition[0] += verticalOffset;
            }
        }
        return fixedWorldPosition;
    }

    public calculateSnapLines(
        srcNode: SNode,
        excludeNodes: SNode[] = [],
        fixedWorldPosition: Vec2Like
    ) {
        const otherPoints = this._collectPoints(excludeNodes);
        const srcWorldPoints = srcNode.getWorldPoints();

        for (let i = 0; i < srcWorldPoints.length; i++) {
            const srcWorldPoint = srcWorldPoints[i];
            for (let j = 0; j < otherPoints.length; j++) {
                const otherPoint = otherPoints[j];
                const dist = getDistance(srcWorldPoint, otherPoint);

                if (dist < 10) {
                    const dir = [
                        otherPoint[0] - srcWorldPoint[0],
                        otherPoint[1] - srcWorldPoint[1],
                    ];
                    fixedWorldPosition[0] += dir[0];
                    fixedWorldPosition[1] += dir[1];
                }
            }
        }
        return fixedWorldPosition;
    }

    private _collectPoints(excludeNodes: SNode[]): ReadonlyVec2[] {
        const otherPoints: ReadonlyVec2[] = [];
        const nodes = this._editor.scene
            .getAllNodes()
            .filter((node) => !excludeNodes.includes(node));
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            /**
             * 如果node 的 rotation 为 90° 的倍数
             * 那么只收集lb与 rt顶点所在的水平线和竖直线
             */

            if (node.rotation % 90 === 0) {
                const rectPoints = getRectByNode(node);

                const lb: IPointData = {
                    x: rectPoints[0],
                    y: rectPoints[1],
                };
                const rt: IPointData = {
                    x: rectPoints[2],
                    y: rectPoints[3],
                };
                const worldLB = node.toGlobal(lb);
                const worldRT = node.toGlobal(rt);

                otherPoints.push(worldLB, worldRT);
            } else {
                const rectPoints = node.getWorldPoints();
                const wLB = rectPoints[0];
                const wLT = rectPoints[1];
                const wRB = rectPoints[2];
                const wRT = rectPoints[3];

                otherPoints.push(wLB, wLT, wRB, wRT);
            }
        }

        return otherPoints;
    }

    public calculateSnapRotation(srcNode: SNode): number {
        // 获取当前角度
        const currentRotation = srcNode.rotation;

        // 定义吸附阈值（角度）
        const ROTATION_SNAP_THRESHOLD = 5; // 5度阈值

        // 计算最接近的90度倍数
        const nearestMultipleOf90 = Math.round(currentRotation / 90) * 90;

        // 检查是否在阈值范围内
        if (
            Math.abs(currentRotation - nearestMultipleOf90) <
            ROTATION_SNAP_THRESHOLD
        ) {
            // 如果在阈值内，返回吸附后的角度
            return nearestMultipleOf90;
        }

        // 如果不在阈值内，返回原始角度
        return currentRotation;
    }
}
