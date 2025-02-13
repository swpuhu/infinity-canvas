import { EventNames, SNodeConfig, SNodeEvents } from '@/common/types';
import SNode from '../SNode';
import { createNodeFromConfig, refSNode } from '../util';
import { Vec2 } from '@/common/Vec2';
import { CanvasEditor } from '../Editor';
import { SScene } from '../SScene';
import { mat3, mat4 } from 'gl-matrix';
import { decomposeMatrix } from '@/common/util';

const RESIZE_GIZMO_SIZE = 10;
const RESIZE_GIZMO_COLOR = 0x00bcfb;

const GIZMO_LINE_WIDTH = 1;

export class ResizeGizmo {
    private _scene: SScene;
    private _editor: CanvasEditor;
    private _root: SNode | null = null;

    private _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rtNodeRef: SNodeConfig.IRefSNode = refSNode();

    private _leftLineRef: SNodeConfig.IRefSNode = refSNode();
    private _rightLineRef: SNodeConfig.IRefSNode = refSNode();
    private _topLineRef: SNodeConfig.IRefSNode = refSNode();
    private _bottomLineRef: SNodeConfig.IRefSNode = refSNode();

    private resizeHandlerNodes: SNode[] = [];

    private _lineNodes: SNode[] = [];

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
                    name: 'lines',
                    type: SNodeConfig.NodeType.CONTAINER,
                    children: [
                        {
                            name: 'left-line',
                            type: SNodeConfig.NodeType.RECT,
                            ref: this._leftLineRef,
                            transform: {
                                anchor: {
                                    x: 0.5,
                                    y: 0,
                                },
                            },
                            style: {
                                fill: RESIZE_GIZMO_COLOR,
                            },
                        },
                        {
                            name: 'right-line',
                            type: SNodeConfig.NodeType.RECT,
                            ref: this._rightLineRef,
                            transform: {
                                anchor: {
                                    x: 0.5,
                                    y: 1,
                                },
                            },
                            style: {
                                fill: RESIZE_GIZMO_COLOR,
                            },
                        },
                        {
                            name: 'top-line',
                            type: SNodeConfig.NodeType.RECT,
                            ref: this._topLineRef,
                            transform: {
                                anchor: {
                                    x: 1,
                                    y: 0.5,
                                },
                            },
                            style: {
                                fill: RESIZE_GIZMO_COLOR,
                            },
                        },
                        {
                            name: 'bottom-line',
                            type: SNodeConfig.NodeType.RECT,
                            ref: this._bottomLineRef,
                            transform: {
                                anchor: {
                                    x: 0,
                                    y: 0.5,
                                },
                            },
                            style: {
                                fill: RESIZE_GIZMO_COLOR,
                            },
                        },
                    ],
                },
                {
                    name: 'resize-points',
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
                },
            ],
        });

        this.resizeHandlerNodes = [
            this._lbNodeRef.value!,
            this._ltNodeRef.value!,
            this._rbNodeRef.value!,
            this._rtNodeRef.value!,
        ];

        this._lineNodes = [
            this._leftLineRef.value!,
            this._rightLineRef.value!,
            this._topLineRef.value!,
            this._bottomLineRef.value!,
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
        const nodeMat = node.getWorldMatrix();
        this._root.width = node.width;
        this._root.height = node.height;

        this._root.setWorldMatrix(nodeMat);

        const [l, b, r, t] = this._root.getLocalRect();
        // console.log(l, b, r, t);

        this._lbNodeRef.value!.position.set(l, b);
        this._ltNodeRef.value!.position.set(l, t);
        this._rbNodeRef.value!.position.set(r, b);
        this._rtNodeRef.value!.position.set(r, t);

        const { scale } = decomposeMatrix(
            this._lbNodeRef.value!.getWorldMatrix()
        );
        const handlerWidth = RESIZE_GIZMO_SIZE / scale.x;
        const handlerHeight = RESIZE_GIZMO_SIZE / scale.y;

        this.resizeHandlerNodes.forEach(node => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = GIZMO_LINE_WIDTH;
        this._leftLineRef.value!.height = t - b;
        this._leftLineRef.value!.position.set(l, b);

        this._bottomLineRef.value!.height = GIZMO_LINE_WIDTH;
        this._bottomLineRef.value!.width = r - l;
        this._bottomLineRef.value!.position.set(l, b);

        this._rightLineRef.value!.width = GIZMO_LINE_WIDTH;
        this._rightLineRef.value!.height = t - b;
        this._rightLineRef.value!.position.set(r, t);

        this._topLineRef.value!.height = GIZMO_LINE_WIDTH;
        this._topLineRef.value!.width = r - l;
        this._topLineRef.value!.position.set(r, t);

        // this._root.rotation = node.rotation;
        // this._root.position.set(node.position.x, node.position.y);
    }
}
