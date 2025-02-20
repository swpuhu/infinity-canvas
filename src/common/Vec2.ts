import { IPoint } from './types';

export class Vec2 implements IPoint {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0, public observeFunc?: () => void) {
        this.x = x;
        this.y = y;
    }

    sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    equals(other: Vec2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    set(x: number, y: number, update = true): void {
        this.x = x;
        this.y = y;
        update && this.observeFunc && this.observeFunc();
    }

    dot(other: Vec2): number {
        return this.x * other.x + this.y * other.y;
    }

    cross(other: Vec2): number {
        return this.x * other.y - this.y * other.x;
    }

    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    rotate(radian: number): Vec2 {
        const cos = Math.cos(radian);
        const sin = Math.sin(radian);
        return new Vec2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    signRad(v: Vec2) {
        // NOTE: this algorithm will return 0.0 without signed if vectors are parallex
        // var angle = this.angle(vector);
        // var cross = this.cross(vector);
        // return Math.sign(cross) * angle;
        return Math.atan2(this.y, this.x) - Math.atan2(v.y, v.x);
    }
}
