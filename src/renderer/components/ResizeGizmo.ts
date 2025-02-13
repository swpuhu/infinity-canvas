import { SNodeConfig } from '@/common/types';
import SNode from '../SNode';
import { SScene } from '../SScene';
import { SSprite } from '../SSprite';
import { createNodeFromConfig } from '../util';

const RESIZE_GIZMO_SIZE = 10;
const RESIZE_GIZMO_COLOR = 0xffbb00;

export class ResizeGizmo {
    private _root: SNode | null = null;
    constructor(scene: SScene) {
        this._createHandler();
        scene.topLayer.addChild(this._root!);
    }

    private _createHandler(): void {
        this._root = createNodeFromConfig({
            name: 'resize-gizmo',
            type: SNodeConfig.NodeType.CONTAINER,
            children: [
                {
                    name: 'left-bottom',
                    type: SNodeConfig.NodeType.RECT,
                    props: {
                        width: RESIZE_GIZMO_SIZE,
                        height: RESIZE_GIZMO_SIZE,
                    },
                    style: {
                        fill: RESIZE_GIZMO_COLOR,
                    },
                },
            ],
        });
    }
}
