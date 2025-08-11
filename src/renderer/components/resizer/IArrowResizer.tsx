import { CanvasEditor } from '@/renderer/Editor';
import { SIArrow } from '@/renderer/RenderComponents/SIArrow';
import SNode from '@/renderer/SNode';
import { createElement } from '@/renderer/createElement';
import { createNodeFromConfig } from '@/renderer/util';

const VERTICAL = 1;
const HORIZONTAL = 0;
type DIRECTION = typeof VERTICAL | typeof HORIZONTAL;

export class IArrowResizer {
    private _currentArrow: SIArrow | null = null;

    private _controls: SNode[] = [];

    private _usedControls: SNode[] = [];

    private _rootNode: SNode | null = null;

    constructor(private _editor: CanvasEditor) {}

    private _getNewControls(direction: DIRECTION) {
        if (this._controls.length) {
            const control = this._controls.pop();
            this._usedControls.push(control!);
            return control;
        }
        const width = direction === VERTICAL ? 10 : 100;
        const height = direction === VERTICAL ? 100 : 10;
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
        console.log('mountToArrow', arrow);
        this._currentArrow = arrow;

        const points = arrow.getPoints();
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const control = this._getNewControls(HORIZONTAL);
            // control.setPosition(p1);
            // arrow.addChild(control);
        }
    }

    public unMount() {
        this._currentArrow = null;
        this._controls.push(...this._usedControls);
        this._usedControls = [];
    }
}
