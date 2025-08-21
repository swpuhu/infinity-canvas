import { Canvas, Paint, Path } from 'canvaskit-wasm';
import { ReadonlyVec2, vec2 } from 'gl-matrix';
import { SRenderComponent } from './SRenderComponent';
import { SNodeConfig } from '@/common/types';
import { CanvasKitModule } from '@/lib/canvaskit';
import { getDistanceFromPointToLine, safeColor } from '@/common/util';
import SNode from '../SNode';

export class SIArrow extends SRenderComponent {
    private _points: ReadonlyVec2[] = [];

    private _path: Path | null = null;

    private _pathIsDirty = true;

    private _paint: Paint | null = null;

    private _options: SNodeConfig.SGraphicsStyleConfig = {};

    private _headNode: SNode | null = null;

    private _tailNode: SNode | null = null;

    private _headPositionInHeadNode: ReadonlyVec2 = [0, 0];

    private _tailPositionInTailNode: ReadonlyVec2 = [0, 0];

    public isOrigin = true;

    protected onCreated(): void {}

    public attachHeadNode(node: SNode, posInHeadNode: ReadonlyVec2): void {
        this._headNode = node;
        this._headPositionInHeadNode = posInHeadNode;
        this._headNode.on(
            'transform-changed',
            this._onHeadNodeTransformChanged
        );

        console.log('SIArrow attachHeadNode', this._headNode);
    }

    public detachHeadNode(): void {
        if (!this._headNode) {
            return;
        }
        this._headNode.off(
            'transform-changed',
            this._onHeadNodeTransformChanged
        );
        this._headNode = null;
        console.log('SIArrow detachHeadNode');
    }

    public attachTailNode(node: SNode, posInTailNode: ReadonlyVec2): void {
        this._tailNode = node;
        this._tailPositionInTailNode = posInTailNode;
        this._tailNode.on(
            'transform-changed',
            this._onTailNodeTransformChanged
        );
        console.log('SIArrow attachTailNode', this._tailNode);
    }

    public detachTailNode(): void {
        if (!this._tailNode) {
            return;
        }
        this._tailNode.off(
            'transform-changed',
            this._onTailNodeTransformChanged
        );
        this._tailNode = null;
        console.log('SIArrow detachTailNode');
    }

    private _onHeadNodeTransformChanged = (): void => {
        if (!this._headNode || !this.node) {
            return;
        }
        const points = this.getPoints();
        let firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const worldP = this._headNode.toGlobal(this._headPositionInHeadNode);
        // 必须保证SIArrow的node节点是 canvasNode 的直接子节点！
        const pInCanvasNode = this.node.parent!.toLocal(worldP);
        const dir = vec2.subtract(vec2.create(), points[1], points[0]);
        const isHorizontal = Math.abs(dir[0]) >= Math.abs(dir[1]);
        firstPoint = pInCanvasNode;
        if (this.isOrigin) {
            this.setPoints([firstPoint, lastPoint]);
            return;
        }
        points[0] = firstPoint;

        if (isHorizontal) {
            points[1] = [points[1][0], points[0][1]];
        } else {
            points[1] = [points[0][0], points[1][1]];
        }

        this.setPoints(points);
    };

    private _onTailNodeTransformChanged = (): void => {
        if (!this._tailNode || !this.node) {
            return;
        }
        const points = this.getPoints();
        const firstPoint = points[0];
        let lastPoint = points[points.length - 1];
        const worldP = this._tailNode.toGlobal(this._tailPositionInTailNode);
        // 必须保证SIArrow的node节点是 canvasNode 的直接子节点！
        const pInCanvasNode = this.node.parent!.toLocal(worldP);
        const dir = vec2.subtract(
            vec2.create(),
            points[points.length - 1],
            points[points.length - 2]
        );
        const isHorizontal = Math.abs(dir[0]) >= Math.abs(dir[1]);
        lastPoint = pInCanvasNode;
        if (this.isOrigin) {
            this.setPoints([firstPoint, lastPoint]);
            return;
        }
        points[points.length - 1] = lastPoint;

        if (isHorizontal) {
            points[points.length - 2] = [
                points[points.length - 2][0],
                lastPoint[1],
            ];
        } else {
            points[points.length - 2] = [
                lastPoint[0],
                points[points.length - 2][1],
            ];
        }

        this.setPoints(points);
    };

    public applyStyle(options: SNodeConfig.SGraphicsStyleConfig = {}) {
        if (this._paint) {
            this._paint.delete();
        }
        this._options = options;
        this._paint = new CanvasKitModule.CanvasKit.Paint();
        this._paint.setColor(safeColor(options.stroke || 0x000000));
        this._paint.setStyle(CanvasKitModule.CanvasKit.PaintStyle.Stroke);
        this._paint.setStrokeWidth(options.strokeWidth || 4);
        this._paint.setAlphaf(options.alpha || 1);
        this._paint.setStrokeCap(CanvasKitModule.CanvasKit.StrokeCap.Round);
        this._paint.setAntiAlias(true);
    }

    public setPoints(points: ReadonlyVec2[]) {
        if (points.length === 2) {
            this.isOrigin = true;
            this._points = this._lerpPoints(points);
        } else {
            this._points = points;
        }
        this._pathIsDirty = true;
    }

    private _lerpPoints(points: ReadonlyVec2[]): ReadonlyVec2[] {
        const start = points[0];
        const end = points[1];
        // 如果是横平竖直就直接返回原始点
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) {
            return points;
        }
        const isHorizontal = Math.abs(dx) >= Math.abs(dy);

        if (isHorizontal && Math.abs(dy) < 1) {
            return [start, end];
        }

        if (!isHorizontal && Math.abs(dx) < 1) {
            return [start, end];
        }

        if (isHorizontal && Math.abs(dx) > 1) {
            const midX = start[0] + dx / 2;
            return [
                start,
                vec2.fromValues(midX, start[1]),
                vec2.fromValues(midX, end[1]),
                end,
            ];
        }
        if (!isHorizontal && Math.abs(dy) > 1) {
            return [start, vec2.fromValues(end[0], start[1]), end];
        }
        // 否则返回原始点
        return [start, end];
    }

    public getPoints(): ReadonlyVec2[] {
        return this._points;
    }

    public addPoint(point: ReadonlyVec2, index: number) {
        this._points.splice(index, 0, point);
        this._pathIsDirty = true;
    }

    public removePoint(index: number) {
        this._points.splice(index, 1);
        this._pathIsDirty = true;
    }

    private _rebuildPath(): void {
        if (this._points.length < 2) {
            return;
        }

        // 计算起点和终点的距离
        const start = this._points[0];
        const end = this._points[this._points.length - 1];
        const ddx = end[0] - start[0];
        const ddy = end[1] - start[1];
        const distance = Math.sqrt(ddx * ddx + ddy * ddy);
        if (this._path) {
            this._path.delete();
            this._path = null;
        }

        // 如果距离小于阈值则返回
        if (distance < 5) {
            return;
        }

        this._path = new CanvasKitModule.CanvasKit.Path();
        this._path.moveTo(this._points[0][0], this._points[0][1]);
        for (let i = 1; i < this._points.length; i++) {
            this._path.lineTo(this._points[i][0], this._points[i][1]);
        }
        const lastPoint = this._points[this._points.length - 1];
        const prevPoint = this._points[this._points.length - 2];
        let dx = lastPoint[0] - prevPoint[0];
        let dy = lastPoint[1] - prevPoint[1];

        // 如果最后两个点重合，则使用前一个点的方向
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && this._points.length > 2) {
            const prevPrevPoint = this._points[this._points.length - 3];
            dx = lastPoint[0] - prevPrevPoint[0];
            dy = lastPoint[1] - prevPrevPoint[1];
        }

        const isHorizontal = Math.abs(dx) >= Math.abs(dy);
        const arrowWidth = 25;
        const arrowHalfHeight = 15;

        if (isHorizontal) {
            const dir = Math.sign(dx) || 1; // 1: 向右，-1: 向左
            const backX = lastPoint[0] - dir * arrowWidth;
            this._path.moveTo(lastPoint[0], lastPoint[1]);
            this._path.lineTo(backX, lastPoint[1] - arrowHalfHeight);
            this._path.moveTo(lastPoint[0], lastPoint[1]);
            this._path.lineTo(backX, lastPoint[1] + arrowHalfHeight);
        } else {
            const dir = Math.sign(dy) || 1; // 1: 向下，-1: 向上
            const backY = lastPoint[1] - dir * arrowWidth;
            this._path.moveTo(lastPoint[0], lastPoint[1]);
            this._path.lineTo(lastPoint[0] - arrowHalfHeight, backY);
            this._path.moveTo(lastPoint[0], lastPoint[1]);
            this._path.lineTo(lastPoint[0] + arrowHalfHeight, backY);
        }

        this._pathIsDirty = false;
    }

    public draw(canvas: Canvas) {
        if (this._pathIsDirty) {
            this._rebuildPath();
        }
        if (!this._path || !this._paint) {
            return;
        }
        canvas.drawPath(this._path, this._paint);
    }

    public hitTest(worldPos: ReadonlyVec2): boolean {
        if (!this._points.length || !this.node) {
            return false;
        }
        const localPos = this.node.toLocal(worldPos);

        for (let i = 0; i < this._points.length - 1; i++) {
            const p1 = this._points[i];
            const p2 = this._points[i + 1];
            const distance = getDistanceFromPointToLine(localPos, p1, p2);
            if (distance < 10) {
                return true;
            }
        }

        return false;
    }
}
