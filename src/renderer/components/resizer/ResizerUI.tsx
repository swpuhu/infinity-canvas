import { createNodeFromConfig } from '@/renderer/util';

import { EventNames, IPointData, SNodeConfig } from '@/common/types';
import SNode from '@/renderer/SNode';
import { refSNode } from '@/renderer/util';
import { WhiteboardScene } from '@/renderer/WhiteboardScene';
import { decomposeMatrix } from '@/common/util';

const RESIZE_GIZMO_SIZE = 10;
const ROTATE_GIZMO_SIZE = 8;
const RESIZE_GIZMO_COLOR = 0x00bcfb;
const ROTATE_GIZMO_COLOR = 0x00ffbc;

const GIZMO_LINE_WIDTH = 1;
const GIZMO_LINE_COLOR = 0xcccccc;

// 通用样式配置
const blockStyle = { fill: RESIZE_GIZMO_COLOR };
const lineStyle = { fill: GIZMO_LINE_COLOR };
const CommonResizePoint = (props: {
    name: string;
    ref: SNodeConfig.IRefSNode;
}) => {
    return (
        <rect
            name={props.name}
            ref={props.ref}
            style={blockStyle}
            width={RESIZE_GIZMO_SIZE}
            height={RESIZE_GIZMO_SIZE}
        ></rect>
    );
};
const Line = (props: {
    name: string;
    ref: SNodeConfig.IRefSNode;
    anchor: IPointData;
}) => {
    return (
        <rect
            name={props.name}
            ref={props.ref}
            style={lineStyle}
            transform={{ anchor: props.anchor }}
        ></rect>
    );
};
export class ResizerUI {
    private _root: SNode | null = null;

    private _lbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _ltNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rbNodeRef: SNodeConfig.IRefSNode = refSNode();
    private _rtNodeRef: SNodeConfig.IRefSNode = refSNode();

    private _leftLineRef: SNodeConfig.IRefSNode = refSNode();
    private _rightLineRef: SNodeConfig.IRefSNode = refSNode();
    private _topLineRef: SNodeConfig.IRefSNode = refSNode();
    private _bottomLineRef: SNodeConfig.IRefSNode = refSNode();

    private _resizeHandlerNodes: SNode[] = [];

    private _rotateRef: SNodeConfig.IRefSNode = refSNode();

    get resizeHandlerNodes(): SNode[] {
        return this._resizeHandlerNodes;
    }

    get rotateHandlerNode(): SNode {
        return this._rotateRef.value!;
    }

    get lbNode(): SNode {
        return this._lbNodeRef.value!;
    }

    get ltNode(): SNode {
        return this._ltNodeRef.value!;
    }

    get rbNode(): SNode {
        return this._rbNodeRef.value!;
    }

    get rtNode(): SNode {
        return this._rtNodeRef.value!;
    }

    get rotateNode(): SNode {
        return this._rotateRef.value!;
    }

    constructor(private _scene: WhiteboardScene) {
        this._createHandler();

        this._scene.on(EventNames.RESIZE, this._onResize);
    }

    get node() {
        if (!this._root) {
            throw new Error('node is not initialized');
        }
        return this._root;
    }

    private _createHandler(): void {
        // 创建控制点
        const controlPoints = [
            { name: 'left-bottom', ref: this._lbNodeRef },
            { name: 'left-top', ref: this._ltNodeRef },
            { name: 'right-bottom', ref: this._rbNodeRef },
            { name: 'right-top', ref: this._rtNodeRef },
        ];

        const rootConfig = (
            <container name="resize-gizmo" active={false}>
                <container name="lines">
                    <Line
                        name="left-line"
                        ref={this._leftLineRef}
                        anchor={{ x: 0.5, y: 0 }}
                    />
                    <Line
                        name="right-line"
                        ref={this._rightLineRef}
                        anchor={{ x: 0.5, y: 1 }}
                    />
                    <Line
                        name="top-line"
                        ref={this._topLineRef}
                        anchor={{ x: 1, y: 0.5 }}
                    />
                    <Line
                        name="bottom-line"
                        ref={this._bottomLineRef}
                        anchor={{ x: 0, y: 0.5 }}
                    />
                </container>
                <container name="resize-points">
                    {controlPoints.map(p => (
                        <CommonResizePoint name={p.name} ref={p.ref} />
                    ))}
                </container>
                <circle
                    name="rotate-point"
                    ref={this._rotateRef}
                    width={ROTATE_GIZMO_SIZE}
                    height={ROTATE_GIZMO_SIZE}
                    style={blockStyle}
                />
            </container>
        );

        this._root = createNodeFromConfig(rootConfig);

        // 收集引用节点
        this._resizeHandlerNodes = controlPoints.map(p => p.ref.value!);
        // this._lineNodes = [
        //     this._leftLineRef.value!,
        //     this._rightLineRef.value!,
        //     this._topLineRef.value!,
        //     this._bottomLineRef.value!,
        // ];
    }

    protected _onResize = (): void => {
        const { scale } = decomposeMatrix(
            this._lbNodeRef.value!.getWorldMatrix()
        );
        const handlerWidth = RESIZE_GIZMO_SIZE / scale.x;
        const handlerHeight = RESIZE_GIZMO_SIZE / scale.y;
        const lineWidth = GIZMO_LINE_WIDTH / scale.x;

        this._resizeHandlerNodes.forEach(node => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = lineWidth;
        this._rightLineRef.value!.width = lineWidth;
        this._topLineRef.value!.height = lineWidth;
        this._bottomLineRef.value!.height = lineWidth;
    };

    public updateHandlerNodes(): void {
        if (!this._root) {
            return;
        }
        const [l, b, r, t] = this._root.getLocalRect();
        // console.log(l, b, r, t);

        this._lbNodeRef.value!.position.set(l, b);
        this._ltNodeRef.value!.position.set(l, t);
        this._rbNodeRef.value!.position.set(r, b);
        this._rtNodeRef.value!.position.set(r, t);

        const { x: scaleX } = this._lbNodeRef.value!.getGlobalScale()!;

        const handlerWidth = RESIZE_GIZMO_SIZE / scaleX;
        const handlerHeight = RESIZE_GIZMO_SIZE / scaleX;
        const rotateHandlerSize = ROTATE_GIZMO_SIZE / scaleX;

        const lineWidth = GIZMO_LINE_WIDTH / scaleX;
        this._resizeHandlerNodes.forEach(node => {
            node.width = handlerWidth;
            node.height = handlerHeight;
        });
        this._leftLineRef.value!.width = lineWidth;
        this._leftLineRef.value!.height = t - b;
        this._leftLineRef.value!.position.set(l, b);

        this._bottomLineRef.value!.height = lineWidth;
        this._bottomLineRef.value!.width = r - l;
        this._bottomLineRef.value!.position.set(l, b);

        this._rightLineRef.value!.width = lineWidth;
        this._rightLineRef.value!.height = t - b;
        this._rightLineRef.value!.position.set(r, t);

        this._topLineRef.value!.height = lineWidth;
        this._topLineRef.value!.width = r - l;
        this._topLineRef.value!.position.set(r, t);

        this._rotateRef.value!.width = rotateHandlerSize;
        this._rotateRef.value!.height = rotateHandlerSize;

        const midX = (l + r) / 2;
        this._rotateRef.value!.position.set(midX, b - 20 / scaleX);
    }
}
