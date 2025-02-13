import type SNode from '@/renderer/SNode';
import { mat3 } from 'gl-matrix';

export function angleToRadians(angle: number) {
    return angle * (Math.PI / 180);
}

export function radiansToAngle(radians: number) {
    return radians * (180 / Math.PI);
}

export function safeColor(color: number | number[]): Float32Array {
    if (Array.isArray(color)) {
        if (color.length === 3) {
            return new Float32Array([color[0], color[1], color[2], 255]);
        }
        if (color.length === 4) {
            return new Float32Array(color);
        }
    } else if (typeof color === 'number') {
        // 如果color在0x000000~0xffffff范围内,则alpha默认为255
        const isRGB = color >= 0x000000 && color <= 0xffffff;
        const a = isRGB ? 255 : (color >> 24) & 0xff;
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        return new Float32Array([r / 255, g / 255, b / 255, a / 255]);
    }
    return new Float32Array([0, 0, 0, 255]);
}

export function loadImageArrayBuffer(src: string): Promise<Uint8Array> {
    return fetch(src)
        .then(res => res.arrayBuffer())
        .then(buffer => new Uint8Array(buffer));
}

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

export function loadImages(srcs: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(srcs.map(src => loadImage(src)));
}
export function findChildByUuid(container: SNode, uuid: string): SNode | null {
    if (container.uuid === uuid) {
        return container;
    }

    for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i];
        const found = findChildByUuid(child, uuid);
        if (found) {
            return found;
        }
    }

    return null;
}

export function decomposeMatrix(matrix: mat3): {
    position: { x: number; y: number };
    scale: { x: number; y: number };
    rotation: number;
} {
    // 从matrix中获取变换值
    const a = matrix[0];
    const b = matrix[1];
    const c = matrix[3];
    const d = matrix[4];
    const tx = matrix[6];
    const ty = matrix[7];

    // 提取位移
    const position = {
        x: tx,
        y: ty,
    };

    // 提取缩放
    const scale = {
        x: Math.sqrt(a * a + b * b),
        y: Math.sqrt(c * c + d * d),
    };

    // 提取旋转（弧度）
    const rotation = Math.atan2(b, a);

    return {
        position,
        scale,
        rotation,
    };
}
