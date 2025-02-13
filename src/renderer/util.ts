import { IPointData, SNodeConfig, TransformOptions } from '@/common/types';
import { SGraphics } from './SGraphics';
import SNode from './SNode';
import { SSprite } from './SSprite';
import { InputRect } from 'canvaskit-wasm';
import { SGeoRect } from './Geometry/SGeoRect';

const nodeNameRefMap = new Map<string, SNode>();

export function refSNode(v?: SNode): SNodeConfig.IRefSNode {
    const ref = {
        value: v,
    };
    return ref;
}

export function createNodeFromConfig(config: SNodeConfig.Config): SNode {
    nodeNameRefMap.clear();
    return createNodeRecursive(config);
}

function createNodeRecursive(config: SNodeConfig.Config): SNode {
    const node = new SNode();
    if (config.ref) {
        config.ref.value = node;
    }
    if (config.name) {
        node.name = config.name;
    }

    if (config.transform) {
        node.setTransform(config.transform);
    }
    if (config.width) {
        node.width = config.width;
    }
    if (config.height) {
        node.height = config.height;
    }

    if (config.needClip) {
        node.needClip = config.needClip;
    }

    // 解析图形属性
    if (config.type === SNodeConfig.NodeType.RECT) {
        const rectConfig = config as SNodeConfig.RectConfig;
        const rect = node.addRenderComp(SGeoRect);

        let alpha = 1;
        if (rectConfig.style?.alpha) {
            alpha = rectConfig.style.alpha;
        }
        if (rectConfig.style?.fill) {
            rect.fill({ color: rectConfig.style.fill, alpha });
        }
        if (rectConfig.style?.stroke) {
            rect.stroke({ color: rectConfig.style.stroke, alpha });
        }
        if (rectConfig.style?.shadow) {
            rect.shadow(rectConfig.style.shadow);
        }
    } else if (config.type === SNodeConfig.NodeType.SPRITE) {
        const spriteConfig = config as SNodeConfig.SpriteConfig;
        const sprite = node.addRenderComp(SSprite);

        sprite.setImageByUrl(spriteConfig.props.url || '');
    }

    // 处理子元素
    config.children?.forEach(childConfig => {
        const childNode = createNodeFromConfig(childConfig);
        node.addChild(childNode);
    });

    return node;
}

export function getRectByNode(node: SNode): InputRect {
    return [
        -node.width * node.anchor.x,
        -node.height * node.anchor.y,
        node.width * (1 - node.anchor.x),
        node.height * (1 - node.anchor.y),
    ];
}
