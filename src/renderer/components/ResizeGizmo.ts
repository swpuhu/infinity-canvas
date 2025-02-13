import { EventNames, SNodeConfig, SNodeEvents } from '@/common/types';
import SNode from '../SNode';
import { createNodeFromConfig, refSNode } from '../util';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '../Editor';
import { SScene } from '../SScene';

const RESIZE_GIZMO_SIZE = 50;
const RESIZE_GIZMO_COLOR = 0x00bcfb;

export class ResizeGizmo {
    private _scene: SScene;
    private _editor: CanvasEditor;
    private _root: SNode | null = null;

    private _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rtNodeRef: SNodeConfig.IRefSNode = refSNode();

    private resizeHandlerNodes: SNode[] = [];

    constructor(editor: CanvasEditor) {
        this._editor = editor;
        this._scene = editor.scene;
        this._createHandler();
        this._scene.topLayer.addChild(this._root!);
        this._bindEvents();
        this._scene.on(EventNames.RESIZE, this._onResize);
    }

    private _onResize = (virtualCanvasScale: Vec2): void => {
        const lbNode = this._lbNodeRef.value!;
        lbNode.width = RESIZE_GIZMO_SIZE / virtualCanvasScale.x;
        lbNode.height = RESIZE_GIZMO_SIZE / virtualCanvasScale.y;
    };

    private _createHandler(): void {
        const globalScale = this._scene.getVirtualCanvasScale();
        const handlerWidth = RESIZE_GIZMO_SIZE / globalScale.x;
        const handlerHeight = RESIZE_GIZMO_SIZE / globalScale.y;

        this._root = createNodeFromConfig({
            name: 'resize-gizmo',
            type: SNodeConfig.NodeType.CONTAINER,
            children: [
                {
                    name: 'left-bottom',
                    type: SNodeConfig.NodeType.RECT,
                    ref: this._lbNodeRef,
                    width: handlerWidth,
                    height: handlerHeight,
                    style: {
                        fill: RESIZE_GIZMO_COLOR,
                    },
                },
                {
                    name: 'left-top',
                    type: SNodeConfig.NodeType.RECT,
                    ref: this._ltNodeRef,
                    width: handlerWidth,
                    height: handlerHeight,
                    style: {
                        fill: RESIZE_GIZMO_COLOR,
                    },
                },
                {
                    name: 'right-bottom',
                    type: SNodeConfig.NodeType.RECT,
                    ref: this._rbNodeRef,
                    width: handlerWidth,
                    height: handlerHeight,
                    style: {
                        fill: RESIZE_GIZMO_COLOR,
                    },
                },
                {
                    name: 'right-top',
                    type: SNodeConfig.NodeType.RECT,
                    ref: this._rtNodeRef,
                    width: handlerWidth,
                    height: handlerHeight,
                    style: {
                        fill: RESIZE_GIZMO_COLOR,
                    },
                },
            ],
        });

        this.resizeHandlerNodes = [
            this._lbNodeRef.value!,
            this._ltNodeRef.value!,
            this._rbNodeRef.value!,
            this._rtNodeRef.value!,
        ];
    }

    private _bindEvents(): void {
        this.resizeHandlerNodes.forEach(node => {
            this._editor.eventSystem.addEventListener(
                node,
                SNodeEvents.POINTER_DOWN,
                this._onResizePointerDown
            );
            this._editor.eventSystem.addEventListener(
                node,
                SNodeEvents.POINTER_MOVE,
                this._onResizePointerMove
            );
            this._editor.eventSystem.addEventListener(
                node,
                SNodeEvents.POINTER_UP,
                this._onResizePointerUp
            );
        });
    }

    private _onResizePointerDown = (event: SNodeEvents.PointerEvent): void => {
        const node = event.target;
        if (!node) {
            return;
        }
        console.log('onResizePointerDown', node.name);
    };

    private _onResizePointerMove = (event: SNodeEvents.PointerEvent): void => {
        console.log(
            'onResizePointerDownMove',
            event.localPosition.x,
            event.localPosition.y
        );
    };

    private _onResizePointerUp = (event: SNodeEvents.PointerEvent): void => {
        const node = event.target;
        if (!node) {
            return;
        }
    };

    public attachToNode(node: SNode): void {
        if (!this._root) {
            return;
        }
        const [wLB, wLT, wRB, wRT] = node.getWorldPoints();
        const lb = this._root.toLocal(wLB);
        const lt = this._root.toLocal(wLT);
        const rb = this._root.toLocal(wRB);
        const rt = this._root.toLocal(wRT);

        this._lbNodeRef.value!.position.set(lb[0], lb[1]);
        this._ltNodeRef.value!.position.set(lt[0], lt[1]);
        this._rbNodeRef.value!.position.set(rb[0], rb[1]);
        this._rtNodeRef.value!.position.set(rt[0], rt[1]);

        this._lbNodeRef.value!.rotation = node.rotation;
        this._ltNodeRef.value!.rotation = node.rotation;
        this._rbNodeRef.value!.rotation = node.rotation;
        this._rtNodeRef.value!.rotation = node.rotation;
    }
}
