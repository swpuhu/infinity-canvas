import { nodePool } from '@/common/NodePool';
import { Pool } from '@/common/Pool';
import { ILine, SNodeConfig } from '@/common/types';
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
                                anchor: { x: 0, y: 0 },
                                position: {
                                    x: 0,
                                    y: index * 50,
                                },
                            }}
                            width={100}
                            height={10}
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

            // Update dash line properties
            dashLine.width = length;
            dashLine.setTransform({
                position: { x: line.start.x, y: line.start.y },
                rotation: angle,
            });
            dashLine.active = true;
        });

        // Make the root node active
        root.active = true;
    }
}
