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

    public calculateSnapLines(
        srcNode: SNode,
        excludeNodes: SNode[] = []
    ): {
        position: IPointData;
        width: number;
        height: number;
        hasSnapped: boolean;
        snapInfos: Array<{
            targetNode: SNode;
            sourceEdge: 'left' | 'right' | 'top' | 'bottom';
            targetEdge: 'left' | 'right' | 'top' | 'bottom';
            offset: number;
        }>;
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

        // Initialize the new position as the current position
        const newPosition: IPointData = {
            x: srcNode.position.x,
            y: srcNode.position.y,
        };

        // Flag to track if any snapping occurred
        let hasSnapped = false;

        // Array to store guide lines to display
        const guideLines: ILine[] = [];

        // 存储吸附信息数组
        const snapInfos: Array<{
            targetNode: SNode;
            sourceEdge: 'left' | 'right' | 'top' | 'bottom';
            targetEdge: 'left' | 'right' | 'top' | 'bottom';
            offset: number;
        }> = [];

        // 跟踪已经处理过的边缘，避免一条边有多个吸附
        const processedEdges = new Set<'left' | 'right' | 'top' | 'bottom'>();

        // 定义对齐检查的配置数组，每个配置包含:
        // - 源边缘值
        // - 目标边缘获取函数
        // - 是否为水平对齐
        // - 线条构建函数
        interface SnapCheck {
            sourceEdge: 'left' | 'right' | 'top' | 'bottom';
            targetEdge: 'left' | 'right' | 'top' | 'bottom';
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
            // 左边缘对齐到左边缘
            {
                sourceEdge: 'left',
                targetEdge: 'left',
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
            // 右边缘对齐到右边缘
            {
                sourceEdge: 'right',
                targetEdge: 'right',
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
            // 顶部对齐到顶部
            {
                sourceEdge: 'top',
                targetEdge: 'top',
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
            // 底部对齐到底部
            {
                sourceEdge: 'bottom',
                targetEdge: 'bottom',
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
            // 左边缘对齐到右边缘
            {
                sourceEdge: 'left',
                targetEdge: 'right',
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
            // 右边缘对齐到左边缘
            {
                sourceEdge: 'right',
                targetEdge: 'left',
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
            // 顶部对齐到底部
            {
                sourceEdge: 'top',
                targetEdge: 'bottom',
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
            // 底部对齐到顶部
            {
                sourceEdge: 'bottom',
                targetEdge: 'top',
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

        let width = srcNode.width;
        let height = srcNode.height;

        // 按照水平和垂直分组检查项，以便优先处理
        const horizontalChecks = snapChecks.filter(
            (check) => check.isHorizontal
        );
        const verticalChecks = snapChecks.filter(
            (check) => !check.isHorizontal
        );

        // 检查每个节点
        for (const node of allNodes) {
            // Skip the source node itself
            if (node === srcNode || excludeNodes.includes(node)) continue;

            // Get the target node's AABB in world coordinates
            const targetAABB = node.getWorldAABB();

            // 先检查水平方向的对齐
            for (const check of horizontalChecks) {
                // 如果这条边已经对齐过，跳过
                if (processedEdges.has(check.sourceEdge)) continue;

                const targetValue = check.targetProp(targetAABB);

                // 检查距离是否在阈值内
                if (Math.abs(check.sourceProp - targetValue) < SNAP_THRESHOLD) {
                    const offset = targetValue - check.sourceProp;

                    // 应用偏移到Y坐标
                    newPosition.y += offset;

                    // 更新高度（如果适用）
                    if (check.sourceEdge === 'top') {
                        height -= offset; // 顶部移动，高度相应减少
                    } else if (check.sourceEdge === 'bottom') {
                        height += offset; // 底部移动，高度相应增加
                    }

                    // 添加指引线
                    guideLines.push(
                        check.createLine(srcAABB, targetAABB, targetValue)
                    );

                    // 保存吸附信息
                    snapInfos.push({
                        targetNode: node,
                        sourceEdge: check.sourceEdge,
                        targetEdge: check.targetEdge,
                        offset,
                    });

                    // 标记这条边已处理
                    processedEdges.add(check.sourceEdge);

                    hasSnapped = true;
                }
            }

            // 再检查垂直方向的对齐
            for (const check of verticalChecks) {
                // 如果这条边已经对齐过，跳过
                if (processedEdges.has(check.sourceEdge)) continue;

                const targetValue = check.targetProp(targetAABB);

                // 检查距离是否在阈值内
                if (Math.abs(check.sourceProp - targetValue) < SNAP_THRESHOLD) {
                    const offset = targetValue - check.sourceProp;

                    // 应用偏移到X坐标
                    newPosition.x += offset;

                    // 更新宽度（如果适用）
                    if (check.sourceEdge === 'left') {
                        width -= offset; // 左侧移动，宽度相应减少
                    } else if (check.sourceEdge === 'right') {
                        width += offset; // 右侧移动，宽度相应增加
                    }

                    // 添加指引线
                    guideLines.push(
                        check.createLine(srcAABB, targetAABB, targetValue)
                    );

                    // 保存吸附信息
                    snapInfos.push({
                        targetNode: node,
                        sourceEdge: check.sourceEdge,
                        targetEdge: check.targetEdge,
                        offset,
                    });

                    // 标记这条边已处理
                    processedEdges.add(check.sourceEdge);

                    hasSnapped = true;
                }
            }
        }

        // Show guide lines if snapping occurred
        if (hasSnapped) {
            this.showGuides(guideLines);
        } else {
            // Hide all guides when no snapping
            this.showGuides([]);
        }

        // 确保尺寸不为负
        width = Math.max(1, width);
        height = Math.max(1, height);

        return {
            position: newPosition,
            width,
            height,
            hasSnapped,
            snapInfos, // 返回所有吸附信息
        };
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
