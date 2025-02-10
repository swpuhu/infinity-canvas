import { SRenderComponent } from './SRenderComponent';

import { mat3, ReadonlyVec2, vec2 } from 'gl-matrix';
import { IPoint, IPointData, TransformOptions } from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { createUUID } from '@/common/uuid';
import { autobind } from 'core-decorators';
import EventEmitter from 'eventemitter3';

class SNode extends EventEmitter {
    private _children: SNode[] = [];
    private _parent: SNode | null = null;
    private _position: IPoint = new Vec2(0, 0);
    private _scale: IPoint = new Vec2(1, 1);
    private _anchor: IPoint = new Vec2(0.5, 0.5);
    private _rotation: number = 0;
    private _localMatrix: mat3 = mat3.create();
    private _worldMatrix: mat3 = mat3.create();
    private _worldMatrixInv: mat3 = mat3.create();

    private _width: number = 0;
    private _height: number = 0;

    private _renderComps: SRenderComponent[] = [];

    public uuid = createUUID();

    public name = '';

    public visible = true;

    private _renderComp: SRenderComponent | null = null;

    public metadata: Record<string, any> = Object.create(null);

    init() {
        this.updateLocalMatrix();
    }

    private updateLocalMatrix() {
        // 重置矩阵
        mat3.identity(this._localMatrix);

        // 移动到位置
        mat3.translate(this._localMatrix, this._localMatrix, [
            this._position.x,
            this._position.y,
        ]);

        // 应用旋转
        mat3.rotate(this._localMatrix, this._localMatrix, this._rotation);
        // 应用缩放
        mat3.scale(this._localMatrix, this._localMatrix, [
            this._scale.x,
            this._scale.y,
        ]);

        // 考虑锚点的影响
        mat3.translate(this._localMatrix, this._localMatrix, [
            -this._width * this._anchor.x,
            -this._height * this._anchor.y,
        ]);
    }

    @autobind
    private updateWorldMatrix() {
        this.updateLocalMatrix();
        if (this._parent) {
            mat3.multiply(
                this._worldMatrix,
                this._parent._worldMatrix,
                this._localMatrix
            );
        } else {
            mat3.copy(this._worldMatrix, this._localMatrix);
        }
        if (this._parent) {
            mat3.multiply(
                this._worldMatrix,
                this._parent._worldMatrix,
                this._localMatrix
            );
        } else {
            mat3.copy(this._worldMatrix, this._localMatrix);
        }
        if (this._parent) {
            mat3.multiply(
                this._worldMatrix,
                this._parent._worldMatrix,
                this._localMatrix
            );
        } else {
            this._worldMatrix = this._localMatrix;
        }

        for (const child of this._children) {
            child.updateWorldMatrix();
        }
    }

    public toGlobal(point: IPointData | ReadonlyVec2): ReadonlyVec2 {
        let pointData: ReadonlyVec2;
        if (point instanceof Array || point instanceof Float32Array) {
            pointData = point;
        } else {
            pointData = [point.x, point.y];
        }

        return vec2.transformMat3(vec2.create(), pointData, this._worldMatrix);
    }

    public toLocal(point: IPointData | ReadonlyVec2): ReadonlyVec2 {
        let pointData: ReadonlyVec2;
        if (point instanceof Array || point instanceof Float32Array) {
            pointData = point;
        } else {
            pointData = [point.x, point.y];
        }

        this._worldMatrixInv = mat3.invert(
            this._worldMatrixInv,
            this._worldMatrix
        );
        if (!this._worldMatrixInv) {
            throw new Error('World matrix is not initialized');
        }
        return vec2.transformMat3(
            vec2.create(),
            pointData,
            this._worldMatrixInv
        );
    }

    public set position(value: IPoint) {
        value.updateFunc = this.updateWorldMatrix;
        this._position = value;
        this.updateWorldMatrix();
    }

    public get position(): Readonly<IPoint> {
        return this._position;
    }

    public get x(): number {
        return this._position.x;
    }

    public get y(): number {
        return this._position.y;
    }

    public get anchor(): Readonly<IPoint> {
        return this._anchor;
    }

    public set anchor(value: IPoint) {
        value.updateFunc = this.updateWorldMatrix;
        this._anchor = value;
    }

    public set scale(value: IPoint) {
        value.updateFunc = this.updateWorldMatrix;
        this._scale = value;
        this.updateWorldMatrix();
    }

    public get scale(): Readonly<IPoint> {
        return this._scale;
    }

    public set rotation(value: number) {
        this._rotation = value;
        this.updateWorldMatrix();
    }

    public get rotation(): Readonly<number> {
        return this._rotation;
    }

    public get children(): Readonly<SNode[]> {
        return this._children;
    }

    public get width(): number {
        return this._width;
    }

    public get height(): number {
        return this._height;
    }

    public set width(value: number) {
        this._width = value;
    }

    public set height(value: number) {
        this._height = value;
    }

    public get parent(): SNode | null {
        return this._parent;
    }

    public setSize(width: number, height: number) {
        this._width = width;
        this._height = height;
    }

    public getLocalRect(): number[] {
        return [
            -this._width * this.anchor.x,
            -this._height * this.anchor.y,
            this._width * (1 - this.anchor.x),
            this._height * (1 - this.anchor.y),
        ];
    }

    public getWorldRect(): number[] {
        const [l, b, r, t] = this.getLocalRect();
        const [wl, wb] = this.toGlobal([l, b]);
        const [wr, wt] = this.toGlobal([r, t]);
        return [wl, wb, wr, wt];
    }

    public addChild(...child: SNode[]) {
        child.forEach(c => c.removeFromParent());
        this._children.push(...child);
        child.forEach(c => {
            c._parent = this;
            c.updateWorldMatrix();
        });
    }

    public removeChild(child: SNode | number) {
        if (typeof child === 'number') {
            this._children.splice(child, 1);
        } else {
            this._children = this._children.filter(c => c !== child);
        }
    }

    public removeFromParent() {
        if (this._parent) {
            this._parent.removeChild(this);
        }
    }

    public setParent(parent: SNode) {
        parent.addChild(this);
        this.updateWorldMatrix();
    }

    public getRenderComps(): SRenderComponent[] {
        return this._renderComps;
    }

    public addRenderComps(...renderComps: SRenderComponent[]): void {
        renderComps.forEach(renderComp => {
            renderComp.node = this;
            const index = this._renderComps.indexOf(renderComp);
            if (index < 0) {
                this._renderComps.push(renderComp);
            }
        });
    }

    public removeChildren(): void {
        this._children.forEach(item => item.destroy());
        this._children = [];
    }

    public destroy(): void {}

    public getWorldMatrix(): mat3 {
        return this._worldMatrix;
    }

    public setTransform(options: TransformOptions) {
        this.position =
            options.position instanceof Vec2
                ? options.position
                : new Vec2(options.position?.x || 0, options.position?.y || 0);
        this.scale =
            options.scale instanceof Vec2
                ? options.scale
                : new Vec2(options.scale?.x || 1, options.scale?.y || 1);
        this.rotation = options.rotation || 0;
        this._anchor =
            options.anchor instanceof Vec2
                ? options.anchor
                : new Vec2(options.anchor?.x || 0.5, options.anchor?.y || 0.5);
    }

    public clone(): SNode {
        const node = new SNode();
        node.name = this.name;
        node.position = this.position.clone();
        node.scale = this.scale.clone();
        node.rotation = this.rotation;
        node._anchor = this._anchor.clone();
        node.visible = this.visible;
        node.metadata = this.metadata;
        node._children = this.children.map(child => child.clone());
        return node;
    }
}

export default SNode;
