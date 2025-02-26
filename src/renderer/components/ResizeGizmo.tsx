import {
    EnumAspectKeepMode,
    EventNames,
    IPointData,
    ResizeGizmoMode,
    SNodeConfig,
    SNodeEvents,
    TransformOptions,
} from '@/common/types';
import SNode from '../SNode';
import {
    alignToNode,
    changeAnchorButStay,
    createNodeFromConfig,
    refSNode,
} from '../util';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '../Editor';
import { ReadonlyVec2, vec2 } from 'gl-matrix';
import { decomposeMatrix, isText, visitNodeRecursive } from '@/common/util';
import { CanvasEventSystem } from '../SEventManager';
import { SParagraph } from '../RenderComponents/SParagraph';
import eventBus from '@/common/eventBus';
import { createElement } from '../createElement';
import { WhiteboardScene } from '../WhiteboardScene';
import { ResizerUI } from './resizer/ResizerUI';
import { EventsHandler } from './resizer/EventsHandler';

const RESIZE_GIZMO_SIZE = 10;
const ROTATE_GIZMO_SIZE = 8;
const RESIZE_GIZMO_COLOR = 0x00bcfb;
const ROTATE_GIZMO_COLOR = 0x00ffbc;

const GIZMO_LINE_WIDTH = 1;
const GIZMO_LINE_COLOR = 0xcccccc;

export class ResizeGizmo {
    private _scene: WhiteboardScene;
    private _editor: CanvasEditor;

    private _uiComponent: ResizerUI;

    private _eventsHandler: EventsHandler;

    constructor(editor: CanvasEditor) {
        this._editor = editor;
        this._scene = editor.scene;

        this._uiComponent = new ResizerUI(this._scene);

        this._scene.topLayer.addChild(this._uiComponent.node!);
        this._eventsHandler = new EventsHandler(editor, this._uiComponent);
        this._eventsHandler.on(EventNames.POINTER_DOWN_NODE, (node?: SNode) => {
            if (!node) {
                this.unMount();
            } else {
                this.mountToNode(node);
            }
        });
    }

    public mountToNode(targetNode: SNode): void {
        this._uiComponent.alignToNode(targetNode);
        this._uiComponent.show();
        this._uiComponent.updateHandlerNodes();
    }

    public unMount(): void {
        this._uiComponent.hide();
    }

    public destroy(): void {}
}
