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

    // ... existing code ...
    public calculateSnapLines(
        srcNode: SNode,
        excludeNodes: SNode[] = []
    ): IPointData {
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

        // Check each node for potential snapping
        for (const node of allNodes) {
            // Skip the source node itself
            if (node === srcNode || excludeNodes.includes(node)) continue;

            // Get the target node's AABB in world coordinates
            const targetAABB = node.getWorldAABB();
            const targetLeft = targetAABB[0];
            const targetTop = targetAABB[1];
            const targetRight = targetAABB[2];
            const targetBottom = targetAABB[3];

            // Check horizontal alignment (left edges)
            if (Math.abs(srcLeft - targetLeft) < SNAP_THRESHOLD) {
                const offset = targetLeft - srcLeft;
                newPosition.x += offset;

                // Add vertical guide line
                guideLines.push({
                    start: {
                        x: targetLeft,
                        y: Math.min(srcTop, targetTop) - 20,
                    },
                    end: {
                        x: targetLeft,
                        y: Math.max(srcBottom, targetBottom) + 20,
                    },
                });

                hasSnapped = true;
            }

            // Check horizontal alignment (right edges)
            if (Math.abs(srcRight - targetRight) < SNAP_THRESHOLD) {
                const offset = targetRight - srcRight;
                newPosition.x += offset;

                // Add vertical guide line
                guideLines.push({
                    start: {
                        x: targetRight,
                        y: Math.min(srcTop, targetTop) - 20,
                    },
                    end: {
                        x: targetRight,
                        y: Math.max(srcBottom, targetBottom) + 20,
                    },
                });

                hasSnapped = true;
            }

            // Check vertical alignment (top edges)
            if (Math.abs(srcTop - targetTop) < SNAP_THRESHOLD) {
                const offset = targetTop - srcTop;
                newPosition.y += offset;

                // Add horizontal guide line
                guideLines.push({
                    start: {
                        x: Math.min(srcLeft, targetLeft) - 20,
                        y: targetTop,
                    },
                    end: {
                        x: Math.max(srcRight, targetRight) + 20,
                        y: targetTop,
                    },
                });

                hasSnapped = true;
            }

            // Check vertical alignment (bottom edges)
            if (Math.abs(srcBottom - targetBottom) < SNAP_THRESHOLD) {
                const offset = targetBottom - srcBottom;
                newPosition.y += offset;

                // Add horizontal guide line
                guideLines.push({
                    start: {
                        x: Math.min(srcLeft, targetLeft) - 20,
                        y: targetBottom,
                    },
                    end: {
                        x: Math.max(srcRight, targetRight) + 20,
                        y: targetBottom,
                    },
                });

                hasSnapped = true;
            }

            // Check horizontal alignment (right to left)
            if (Math.abs(srcLeft - targetRight) < SNAP_THRESHOLD) {
                const offset = targetRight - srcLeft;
                newPosition.x += offset;

                // Add vertical guide line
                guideLines.push({
                    start: {
                        x: targetRight,
                        y: Math.min(srcTop, targetTop) - 20,
                    },
                    end: {
                        x: targetRight,
                        y: Math.max(srcBottom, targetBottom) + 20,
                    },
                });

                hasSnapped = true;
            }

            // Check horizontal alignment (left to right)
            if (Math.abs(srcRight - targetLeft) < SNAP_THRESHOLD) {
                const offset = targetLeft - srcRight;
                newPosition.x += offset;

                // Add vertical guide line
                guideLines.push({
                    start: {
                        x: targetLeft,
                        y: Math.min(srcTop, targetTop) - 20,
                    },
                    end: {
                        x: targetLeft,
                        y: Math.max(srcBottom, targetBottom) + 20,
                    },
                });

                hasSnapped = true;
            }

            // Check vertical alignment (bottom to top)
            if (Math.abs(srcTop - targetBottom) < SNAP_THRESHOLD) {
                const offset = targetBottom - srcTop;
                newPosition.y += offset;

                // Add horizontal guide line
                guideLines.push({
                    start: {
                        x: Math.min(srcLeft, targetLeft) - 20,
                        y: targetBottom,
                    },
                    end: {
                        x: Math.max(srcRight, targetRight) + 20,
                        y: targetBottom,
                    },
                });

                hasSnapped = true;
            }

            // Check vertical alignment (top to bottom)
            if (Math.abs(srcBottom - targetTop) < SNAP_THRESHOLD) {
                const offset = targetTop - srcBottom;
                newPosition.y += offset;

                // Add horizontal guide line
                guideLines.push({
                    start: {
                        x: Math.min(srcLeft, targetLeft) - 20,
                        y: targetTop,
                    },
                    end: {
                        x: Math.max(srcRight, targetRight) + 20,
                        y: targetTop,
                    },
                });

                hasSnapped = true;
            }
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
    // ... existing code ...
}
