import { EventNames, SNodeConfig } from '@/common/types';
import SNode from '../SNode';
import { SScene } from '../SScene';
import { SSprite } from '../SSprite';
import { createNodeFromConfig, refSNode } from '../util';
import { Vec2 } from '@/common/Vec2';

const RESIZE_GIZMO_SIZE = 10;
const RESIZE_GIZMO_COLOR = 0x00bcfb;

export class ResizeGizmo {
    private _scene: SScene;

    private _root: SNode | null = null;

    private _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rtNodeRef: SNodeConfig.IRefSNode = refSNode();

    constructor(scene: SScene) {
        this._scene = scene;
        this._createHandler();
        scene.topLayer.addChild(this._root!);
        scene.on(EventNames.RESIZE, this._onResize);
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
    }

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
