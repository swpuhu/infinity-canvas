import { SRenderComponent } from './RenderComponents/SRenderComponent';

import { mat3, ReadonlyVec2, vec2 } from 'gl-matrix';
import {
    EnumAspectKeepMode,
    EnumRenderComponentType,
    EventNames,
    IPoint,
    IPointData,
    SNodeEvents,
    TransformOptions,
} from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { createUUID } from '@/common/uuid';
import { autobind } from 'core-decorators';
import EventEmitter from 'eventemitter3';
import { angleToRadians, decomposeMatrix } from '@/common/util';

class SNode extends EventEmitter {
    private _children: SNode[] = [];
    private _parent: SNode | null = null;
    private _position: IPoint = new Vec2(0, 0, () => {
        // console.log(
        //     this.name,
        //     'position-changed',
        //     this.position.x,
        //     this.position.y
        // );
        this.updateWorldMatrix();
    });
    private _scale: IPoint = new Vec2(1, 1, this.updateWorldMatrix);
    private _anchor: IPoint = new Vec2(0.5, 0.5, this.updateWorldMatrix);
    private _rotation: number = 0;
    private _localMatrix: mat3 = mat3.create();
    private _worldMatrix: mat3 = mat3.create();
    private _worldMatrixInv: mat3 = mat3.create();

    private _width: number = 0;
    private _height: number = 0;

    private _renderComps: SRenderComponent[] = [];

    public needClip: boolean = false;

    public uuid = createUUID();

    public name = '';

    private _renderComp: SRenderComponent | null = null;

    public _eventPhase: keyof SNodeEvents.EventMap | '' = '';

    public metadata: Record<string, any> = Object.create(null);

    private _flag: number = 0;

    private _activeInHierarchy: boolean = true;

    private _active = true;

    public aspectKeepMode = EnumAspectKeepMode.NONE;

    public renderType: EnumRenderComponentType = EnumRenderComponentType.NONE;

    get active() {
        return this._active;
    }

    set active(value: boolean) {
        this._active = value;
    }

    get activeInHierarchy(): boolean {
        if (!this._active) {
            return false;
        }
        if (this._parent) {
            return this._parent.activeInHierarchy;
        }
        return true;
    }

    private _hierarchyChange(active: boolean) {
        this._activeInHierarchy = active;
        for (const child of this._children) {
            child._hierarchyChange(active);
        }
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
        mat3.rotate(
            this._localMatrix,
            this._localMatrix,
            angleToRadians(this._rotation)
        );
        // 应用缩放
        mat3.scale(this._localMatrix, this._localMatrix, [
            this._scale.x,
            this._scale.y,
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

    public getGlobalScale(): IPointData {
        const result = decomposeMatrix(this._worldMatrix);
        return result.scale;
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
        value.observeFunc = this.updateWorldMatrix;
        this._anchor = value;
    }

    public set scale(value: IPoint) {
        value.observeFunc = this.updateWorldMatrix;
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
        this.emit(SNodeEvents.SIZE_CHANGE);
    }

    public getLocalRect(): number[] {
        return [
            -this._width * this.anchor.x,
            -this._height * this.anchor.y,
            this._width * (1 - this.anchor.x),
            this._height * (1 - this.anchor.y),
        ];
    }

    public getWorldPoints(): ReadonlyVec2[] {
        const [l, b, r, t] = this.getLocalRect();
        const wLB = this.toGlobal([l, b]);
        const wLT = this.toGlobal([l, t]);
        const wRB = this.toGlobal([r, b]);
        const wRT = this.toGlobal([r, t]);
        return [wLB, wLT, wRB, wRT];
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
            c.emit(SNodeEvents.HIERARCHY_CHANGE);
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

    public addComponent<T extends SRenderComponent>(CompCtr: new () => T): T {
        const instance = new CompCtr();
        instance.node = this;
        instance.init();
        this._renderComps.push(instance);
        return instance;
    }

    public getComponent<T extends SRenderComponent>(
        compCtr: new () => T
    ): T | null {
        return this._renderComps.find(comp => comp instanceof compCtr) as T;
    }

    public removeChildren(): void {
        this._children.forEach(item => item.destroy());
        this._children = [];
    }

    public getWorldMatrix(): mat3 {
        return this._worldMatrix;
    }

    public getWorldMatrixInverse(): mat3 {
        this._worldMatrixInv = mat3.invert(
            this._worldMatrixInv,
            this._worldMatrix
        );
        return this._worldMatrixInv;
    }

    public getLocalMatrix(): mat3 {
        return this._localMatrix;
    }

    public setLocalMatrix(matrix: mat3) {
        mat3.copy(this._localMatrix, matrix);
        this.updateWorldMatrix();
    }

    public setWorldMatrix(worldMat: mat3) {
        if (this.parent) {
            const inv = this.parent.getWorldMatrixInverse();
            const newLocalMat = mat3.mul(mat3.create(), inv, worldMat);
            this.setLocalMatrix(newLocalMat);
            const result = decomposeMatrix(newLocalMat);

            this._position.set(result.position.x, result.position.y, false);
            this._scale.set(result.scale.x, result.scale.y, false);
            this._rotation = result.rotation * (180 / Math.PI);
            this.updateWorldMatrix();
        } else {
            this.setLocalMatrix(worldMat);
        }
    }
    public setTransform(options: TransformOptions) {
        if (options.position) {
            this._position.set(options.position.x, options.position.y);
        }
        if (options.scale) {
            this._scale.set(options.scale.x, options.scale.y);
        }
        if (options.rotation) {
            this._rotation = options.rotation;
        }
        if (options.anchor) {
            this._anchor.set(options.anchor.x, options.anchor.y);
        }

        this.updateWorldMatrix();
    }

    public hitTest(worldPos: ReadonlyVec2): boolean {
        if (!this._active) {
            return false;
        }

        if (this.width === 0 || this.height === 0) {
            return false;
        }

        const [l, b, r, t] = this.getLocalRect();
        const localPos = this.toLocal(worldPos);
        if (
            localPos[0] <= l ||
            localPos[0] >= r ||
            localPos[1] <= b ||
            localPos[1] >= t
        ) {
            return false;
        }
        return true;
    }

    public getNodeByName(name: string): SNode | null {
        if (this.name === name) {
            return this;
        }
        for (const child of this._children) {
            const node = child.getNodeByName(name);
            if (node) {
                return node;
            }
        }
        return null;
    }

    public destroy(): void {
        this._renderComps.forEach(renderComp => {
            renderComp.destroy();
        });
    }
}

export default SNode;
