import { IPointData, SNodeConfig, TransformOptions } from '@/common/types';
import { SGraphics } from './SGraphics';
import SNode from './SNode';
import { SSprite } from './SSprite';

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
        const graphics = new SGraphics();
        node.addRenderComps(graphics);
        graphics.rect(
            rectConfig.props.x || 0,
            rectConfig.props.y || 0,
            rectConfig.props.width || 100,
            rectConfig.props.height || 100
        );
        let alpha = 1;
        if (rectConfig.style?.alpha) {
            alpha = rectConfig.style.alpha;
        }
        if (rectConfig.style?.fill) {
            graphics.fill({ color: rectConfig.style.fill, alpha });
        }
        if (rectConfig.style?.shadow) {
            graphics.shadow(rectConfig.style.shadow);
        }
    } else if (config.type === SNodeConfig.NodeType.SPRITE) {
        const spriteConfig = config as SNodeConfig.SpriteConfig;
        const sprite = new SSprite();
        node.addRenderComps(sprite);
        sprite.setImageByUrl(spriteConfig.props.url || '');
    }

    // 处理子元素
    config.children?.forEach(childConfig => {
        const childNode = createNodeFromConfig(childConfig);
        node.addChild(childNode);
    });

    return node;
}
