import { CanvasEditor } from '@/renderer/Editor';
import { GIZMO_DIRECTIONS, ResizerUI } from './ResizerUI';
import { EventNames } from '@/common/types';
import { Path } from 'canvaskit-wasm';
import { CanvasKitModule } from '@/lib/canvaskit';
import SNode from '@/renderer/SNode';
import { createElement } from '@/renderer/createElement';
import { createNodeFromConfig } from '@/renderer/util';

export class HoverEventsHandler {
    private _tempArrowAndNode: SNode | null = null;
    constructor(private _editor: CanvasEditor, private _resizerUI: ResizerUI) {
        this._bindEvents();
    }

    private _createArrowPath(
        srcNode: SNode,
        direction: GIZMO_DIRECTIONS
    ): SNode {
        console.log(srcNode.width, srcNode.height);
        const config = (
            <container>
                <arrow
                    width={srcNode.width}
                    height={srcNode.height}
                    transform={{
                        anchor: {
                            x: 0,
                            y: 0.5,
                        },
                    }}
                    style={{
                        fill: 0x777777,
                    }}
                />
                <rect
                    width={srcNode.width}
                    height={srcNode.height}
                    style={{
                        fill: 0x777777,
                    }}
                />
            </container>
        );

        return createNodeFromConfig(config);
    }

    private _bindEvents(): void {
        this._resizerUI.on(
            EventNames.ADD_SHAPE_HOVERED,
            (node: SNode, direction: GIZMO_DIRECTIONS) => {
                console.log('direction', direction);
                const arrow = this._createArrowPath(node, direction);

                const canvasNode = this._editor.scene.getCanvasNode();
                canvasNode.addChild(arrow);

                this._tempArrowAndNode = arrow;
            }
        );

        this._resizerUI.on(EventNames.ADD_SHAPE_UNHOVERED, () => {
            console.log('ADD_SHAPE_UNHOVERED');
            if (this._tempArrowAndNode) {
                this._tempArrowAndNode.destroy();
                this._tempArrowAndNode = null;
            }
        });
    }
}
