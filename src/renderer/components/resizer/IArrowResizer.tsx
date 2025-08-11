import { CanvasEditor } from '@/renderer/Editor';
import { SIArrow } from '@/renderer/RenderComponents/SIArrow';
import SNode from '@/renderer/SNode';
import { createElement } from '@/renderer/createElement';
import { createNodeFromConfig } from '@/renderer/util';
import { vec2 } from 'gl-matrix';

const VERTICAL = 1;
const HORIZONTAL = 0;
type DIRECTION = typeof VERTICAL | typeof HORIZONTAL;

export class IArrowResizer {
    private _currentArrow: SIArrow | null = null;

    private _controls: SNode[] = [];

    private _usedControls: SNode[] = [];

    private _rootNode: SNode | null = null;

    constructor(private _editor: CanvasEditor) {
        this._rootNode = new SNode();
        this._editor.scene.topLayer.addChild(this._rootNode);
    }

    private _getNewControls(direction: DIRECTION): SNode {
        if (this._controls.length) {
            const control = this._controls.pop();
            this._usedControls.push(control!);
            return control!;
        }
        const width = direction === VERTICAL ? 10 : 20;
        const height = direction === VERTICAL ? 20 : 10;
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
        this._usedControls.push(controlNode);
        return controlNode;
    }

    public mountTo(arrow: SIArrow) {
        if (this._rootNode) {
            this._rootNode.active = true;
        }
        console.log('mountToArrow', arrow);
        this._currentArrow = arrow;

        const points = arrow.getPoints();
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
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

            this._rootNode?.addChild(control!);
            // control.setPosition(p1);
            // arrow.addChild(control);
        }
    }

    public unMount() {
        if (this._rootNode) {
            this._rootNode.active = false;
        }
        this._currentArrow = null;
        this._controls.push(...this._usedControls);
        this._usedControls = [];
    }
}
