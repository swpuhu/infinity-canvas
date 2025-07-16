import type SNode from '@/renderer/SNode';
import { mat3, ReadonlyVec2 } from 'gl-matrix';
import { CursorStyle, EnumRenderComponentType, ResizeDirection } from './types';
import { SParagraph } from '@/renderer/RenderComponents/SParagraph';

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
        const isRGB = color >= 0x000000 && color <= 0xffffff;

        // Extract color components - same for both formats
        const r = (color >> (isRGB ? 16 : 24)) & 0xff;
        const g = (color >> (isRGB ? 8 : 16)) & 0xff;
        const b = (color >> (isRGB ? 0 : 8)) & 0xff;
        const a = isRGB ? 255 : color & 0xff;

        return new Float32Array([r / 255, g / 255, b / 255, a / 255]);
    }
    return new Float32Array([0, 0, 0, 255]);
}

export function loadImageArrayBuffer(src: string): Promise<Uint8Array> {
    return fetch(src)
        .then((res) => res.arrayBuffer())
        .then((buffer) => new Uint8Array(buffer));
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
    return Promise.all(srcs.map((src) => loadImage(src)));
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

export function compareNodeDepth(nodeA: SNode, nodeB: SNode) {
    // 计算节点a的深度和路径
    let depthA = 0;
    const pathA: number[] = [];
    while (nodeA.parent) {
        pathA.unshift(nodeA.parent.children.indexOf(nodeA));
        depthA++;
        nodeA = nodeA.parent;
    }

    // 计算节点b的深度和路径
    let depthB = 0;
    const pathB: number[] = [];
    while (nodeB.parent) {
        pathB.unshift(nodeB.parent.children.indexOf(nodeB));
        depthB++;
        nodeB = nodeB.parent;
    }

    // 首先比较深度
    if (depthA !== depthB) {
        return depthB - depthA; // 深度大的排在前面
    }

    // 如果深度相同，比较在同层级中的顺序
    // 从根节点开始比较每一层的索引
    for (let i = 0; i < pathA.length; i++) {
        if (pathA[i] !== pathB[i]) {
            return pathB[i] - pathA[i]; // 索引大的排在前面
        }
    }

    return 0; // 完全相同的位置
}

export function visitNodeRecursive(
    node: SNode,
    callback: (node: SNode) => void
) {
    callback(node);
    for (const child of node.children) {
        visitNodeRecursive(child, callback);
    }
}

export function isSprite(node: SNode): boolean {
    return node.renderType === EnumRenderComponentType.SPRITE;
}

export function isText(node: SNode): boolean {
    return node.renderType === EnumRenderComponentType.TEXT;
}

/**
 * 检测用户的操作系统是否是Mac OS
 * 使用多种方法综合判断，提高准确性和兼容性
 * @returns {boolean} 如果是Mac OS返回true，否则返回false
 */
export function isMacOS(): boolean {
    try {
        // 方法1：检查navigator.userAgent
        if (navigator.userAgent) {
            const userAgent = navigator.userAgent.toLowerCase();
            if (
                userAgent.includes('mac os x') ||
                userAgent.includes('macintosh')
            ) {
                return true;
            }
        }

        // 方法2：使用navigator.platform (虽已弃用但仍广泛支持)
        if (navigator.platform) {
            const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
            if (macPlatforms.includes(navigator.platform)) {
                return true;
            }
        }

        // 方法3：检查navigator.appVersion
        if (
            navigator.appVersion &&
            navigator.appVersion.indexOf('Mac') !== -1
        ) {
            return true;
        }

        // 方法4：使用现代的navigator.userAgentData API (可能不被所有浏览器支持)
        if ('userAgentData' in navigator) {
            try {
                const userAgentData = (navigator as any).userAgentData;
                if (userAgentData && userAgentData.platform === 'macOS') {
                    return true;
                }
            } catch (e) {
                // 忽略错误，继续尝试其他方法
            }
        }

        return false;
    } catch (e) {
        console.error('检测Mac操作系统时发生错误:', e);
        return false; // 发生任何错误时默认返回false
    }
}

export function moveIntoButStay(node: SNode, target: SNode): void {
    // 如果节点已经在目标节点中，则不需要操作
    if (node.parent === target) {
        return;
    }

    // 保存节点当前的世界矩阵
    const worldMatrix = mat3.copy(mat3.create(), node.getWorldMatrix());

    // 将节点从原父节点中移除并添加到目标节点中
    if (node.parent) {
        node.removeFromParent();
    }
    target.addChild(node);

    // 重新设置节点的世界矩阵，保持其在世界坐标系中的位置不变
    node.setWorldMatrix(worldMatrix);
}

export function isCtrlKey(event: KeyboardEvent | WheelEvent): boolean {
    if (isMacOS()) {
        return event.metaKey;
    }
    return event.ctrlKey;
}

export function textIsIndependent(textComp: SParagraph): boolean {
    return textComp.node?.parent === undefined;
}

export function getCursorStyleString(
    cursorStyle: CursorStyle,
    resizeDirection?: ResizeDirection
): string {
    if (cursorStyle === CursorStyle.RESIZE) {
        if (!resizeDirection) {
            throw new Error(
                'resizeDirection is required when cursorStyle is RESIZE'
            );
        }
        // 根据 resizeDirection 返回相应的鼠标样式
        return `${resizeDirection}-resize`;
    } else if (cursorStyle === CursorStyle.ROTATE) {
        return "url('rotate.png') 12 12, auto";
    } else if (cursorStyle === CursorStyle.INSERT) {
        return 'crosshair';
    } else if (cursorStyle === CursorStyle.TEXT_EDIT) {
        return 'text';
    } else if (cursorStyle === CursorStyle.HAND_TOOL) {
        return 'grab';
    }
    return 'default';
}

export function excludeNearNodes(
    points: ReadonlyVec2[],
    distance: number
): ReadonlyVec2[] {
    // 如果点数组为空,直接返回空数组
    if (points.length === 0) {
        return [];
    }

    // 创建结果数组,先加入第一个点
    const result: ReadonlyVec2[] = [points[0]];

    // 遍历剩余的点
    for (let i = 1; i < points.length; i++) {
        const point = points[i];

        // 检查当前点是否与已保存的点距离都大于distance
        let shouldAdd = true;
        for (const savedPoint of result) {
            const dx = point[0] - savedPoint[0];
            const dy = point[1] - savedPoint[1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < distance) {
                shouldAdd = false;
                break;
            }
        }

        // 如果当前点与所有已保存点距离都大于distance,则加入结果数组
        if (shouldAdd) {
            result.push(point);
        }
    }

    return result;
}

export function getDistance(point1: ReadonlyVec2, point2: ReadonlyVec2) {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

export function zoomToScale(zoomValue: number) {
    return Math.exp(zoomValue);
}

export function scaleToZoom(scale: number) {
    return Math.log(scale);
}

export function getNodesByNodeIds(nodeIds: string[], parentNode: SNode) {
    const nodes = nodeIds
        .map((id) => {
            return parentNode.getNodeByUUID(id);
        })
        .filter((node) => node !== null);
    return nodes;
}
