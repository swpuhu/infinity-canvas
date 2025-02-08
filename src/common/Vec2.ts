import { IPoint } from './types';

export class Vec2 implements IPoint {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0, public updateFunc?: () => void) {
        this.x = x;
        this.y = y;
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    equals(other: Vec2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    set(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.updateFunc && this.updateFunc();
    }

    dot(other: Vec2): number {
        return this.x * other.x + this.y * other.y;
    }

    cross(other: Vec2): number {
        return this.x * other.y - this.y * other.x;
    }
}
