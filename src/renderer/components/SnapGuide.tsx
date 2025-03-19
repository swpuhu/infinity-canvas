import { nodePool } from '@/common/NodePool';
import { Pool } from '@/common/Pool';
import eventBus from '@/common/eventBus';
import { ILine, IPointData, SNodeConfig } from '@/common/types';
import { CanvasEditor } from '../Editor';
import SNode from '../SNode';
import { createElement } from '../createElement';
import { createNodeFromConfig, refSNode } from '../util';

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

    public showGuides(lines: ILine[]): void {
        console.log('showGuides', lines);
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
                console.log('水平线', startLocal, angle);
                dashLine.setTransform({
                    position: { x: startLocal[0], y: startLocal[1] },
                    rotation: 0,
                    anchor: { x: 0, y: 0.5 }, // 确保水平线的锚点在线的中心
                });
                eventBus.reDraw();
            } else {
                // 垂直线
                console.log('垂直线', startLocal, angle);
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

    public calculateSnapLines(
        srcNode: SNode,
        excludeNodes: SNode[] = []
    ): {
        position: IPointData;
        width: number;
        height: number;
    } {
        const allNodes = this._editor.scene.getAllNodes();
        // Threshold for snapping (distance in pixels)
        const SNAP_THRESHOLD = 10;

        // Get the source node's AABB in world coordinates
        const srcAABB = srcNode.getWorldAABB();
        const srcLeft = srcAABB[0];
        const srcTop = srcAABB[1];
        const srcRight = srcAABB[2];
        const srcBottom = srcAABB[3];

        // Current position of the source node in world coordinates
        const srcWorldPos = srcNode.worldPosition;

        // Initialize the new position as the current position
        const newPosition: IPointData = {
            x: srcNode.position.x,
            y: srcNode.position.y,
        };

        // Flag to track if any snapping occurred
        let hasSnapped = false;

        // Array to store guide lines to display
        const guideLines: ILine[] = [];

        // 定义对齐检查的配置数组，每个配置包含:
        // - 源边缘值
        // - 目标边缘获取函数
        // - 是否为水平对齐
        // - 线条构建函数
        interface SnapCheck {
            sourceProp: number;
            targetProp: (targetAABB: number[]) => number;
            isHorizontal: boolean;
            createLine: (
                srcAABB: number[],
                targetAABB: number[],
                value: number
            ) => ILine;
        }

        // 定义所有需要检查的对齐情况
        const snapChecks: SnapCheck[] = [
            // 左边缘对齐
            {
                sourceProp: srcLeft,
                targetProp: (targetAABB) => targetAABB[0], // targetLeft
                isHorizontal: false,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: value,
                        y: Math.min(srcAABB[1], targetAABB[1]) - 20, // min top
                    },
                    end: {
                        x: value,
                        y: Math.max(srcAABB[3], targetAABB[3]) + 20, // max bottom
                    },
                }),
            },
            // 右边缘对齐
            {
                sourceProp: srcRight,
                targetProp: (targetAABB) => targetAABB[2], // targetRight
                isHorizontal: false,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: value,
                        y: Math.min(srcAABB[1], targetAABB[1]) - 20,
                    },
                    end: {
                        x: value,
                        y: Math.max(srcAABB[3], targetAABB[3]) + 20,
                    },
                }),
            },
            // 顶部对齐
            {
                sourceProp: srcTop,
                targetProp: (targetAABB) => targetAABB[1], // targetTop
                isHorizontal: true,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: Math.min(srcAABB[0], targetAABB[0]) - 20, // min left
                        y: value,
                    },
                    end: {
                        x: Math.max(srcAABB[2], targetAABB[2]) + 20, // max right
                        y: value,
                    },
                }),
            },
            // 底部对齐
            {
                sourceProp: srcBottom,
                targetProp: (targetAABB) => targetAABB[3], // targetBottom
                isHorizontal: true,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: Math.min(srcAABB[0], targetAABB[0]) - 20,
                        y: value,
                    },
                    end: {
                        x: Math.max(srcAABB[2], targetAABB[2]) + 20,
                        y: value,
                    },
                }),
            },
            // 左边缘到右边缘对齐
            {
                sourceProp: srcLeft,
                targetProp: (targetAABB) => targetAABB[2], // targetRight
                isHorizontal: false,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: value,
                        y: Math.min(srcAABB[1], targetAABB[1]) - 20,
                    },
                    end: {
                        x: value,
                        y: Math.max(srcAABB[3], targetAABB[3]) + 20,
                    },
                }),
            },
            // 右边缘到左边缘对齐
            {
                sourceProp: srcRight,
                targetProp: (targetAABB) => targetAABB[0], // targetLeft
                isHorizontal: false,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: value,
                        y: Math.min(srcAABB[1], targetAABB[1]) - 20,
                    },
                    end: {
                        x: value,
                        y: Math.max(srcAABB[3], targetAABB[3]) + 20,
                    },
                }),
            },
            // 顶部到底部对齐
            {
                sourceProp: srcTop,
                targetProp: (targetAABB) => targetAABB[3], // targetBottom
                isHorizontal: true,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: Math.min(srcAABB[0], targetAABB[0]) - 20,
                        y: value,
                    },
                    end: {
                        x: Math.max(srcAABB[2], targetAABB[2]) + 20,
                        y: value,
                    },
                }),
            },
            // 底部到顶部对齐
            {
                sourceProp: srcBottom,
                targetProp: (targetAABB) => targetAABB[1], // targetTop
                isHorizontal: true,
                createLine: (srcAABB, targetAABB, value) => ({
                    start: {
                        x: Math.min(srcAABB[0], targetAABB[0]) - 20,
                        y: value,
                    },
                    end: {
                        x: Math.max(srcAABB[2], targetAABB[2]) + 20,
                        y: value,
                    },
                }),
            },
        ];

        // 检查每个节点
        for (const node of allNodes) {
            // Skip the source node itself
            if (node === srcNode || excludeNodes.includes(node)) continue;

            // Get the target node's AABB in world coordinates
            const targetAABB = node.getWorldAABB();

            // 检查每种对齐情况
            for (const check of snapChecks) {
                const targetValue = check.targetProp(targetAABB);

                // 检查距离是否在阈值内
                if (Math.abs(check.sourceProp - targetValue) < SNAP_THRESHOLD) {
                    // 计算偏移
                    const offset = targetValue - check.sourceProp;

                    // 应用偏移
                    if (check.isHorizontal) {
                        newPosition.y += offset;
                    } else {
                        newPosition.x += offset;
                    }

                    // 添加指引线
                    guideLines.push(
                        check.createLine(srcAABB, targetAABB, targetValue)
                    );

                    hasSnapped = true;
                }
            }

            if (hasSnapped) break; // 找到一个对齐点就跳出外循环
        }

        // Show guide lines if snapping occurred
        if (hasSnapped) {
            this.showGuides(guideLines);
        } else {
            // Hide all guides when no snapping
            this.showGuides([]);
        }

        return newPosition;
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
