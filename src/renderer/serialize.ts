import SNode from './SNode';
import { SNodeConfig } from '@/common/types';
import { SGeoRect } from './Geometry/SGeoRect';
import { SGeoEllipse } from './Geometry/SGeoEllipse';
import { SSprite } from './RenderComponents/SSprite';
import { SParagraph } from './RenderComponents/SParagraph';
import { Vec2 } from '@/common/Vec2';

export function serialize(node: SNode): string {
    const config = serializeRecursive(node);
    return JSON.stringify(config);
}

function serializeRecursive(node: SNode): SNodeConfig.Config {
    const baseConfig: SNodeConfig.BaseConfig = {
        type:
            node.renderType === 'sprite'
                ? SNodeConfig.NodeType.SPRITE
                : node.renderType === 'text'
                ? SNodeConfig.NodeType.PARAGRAPH
                : SNodeConfig.NodeType.CONTAINER,
        name: node.name,
        width: node.width,
        height: node.height,
        needClip: node.needClip,
        active: node.active,
        transform: {
            position: node.position
                ? { x: node.position.x, y: node.position.y }
                : undefined,
            scale: node.scale
                ? { x: node.scale.x, y: node.scale.y }
                : undefined,
            rotation: node.rotation,
            anchor: node.anchor
                ? { x: node.anchor.x, y: node.anchor.y }
                : undefined,
        },
    };

    // 序列化子节点
    if (node.children && node.children.length > 0) {
        baseConfig.children = node.children.map((child) =>
            serializeRecursive(child)
        );
    }

    // 根据节点类型添加特定属性
    switch (node.renderType) {
        case 'sprite': {
            const spriteComp = node.getComponent(SSprite);
            if (spriteComp) {
                return {
                    ...baseConfig,
                    type: SNodeConfig.NodeType.SPRITE,
                    url: spriteComp.url,
                };
            }
            break;
        }
        case 'text': {
            const paraComp = node.getComponent(SParagraph);
            if (paraComp) {
                const config = {
                    ...baseConfig,
                    type: SNodeConfig.NodeType.PARAGRAPH,
                    text: paraComp.text,
                } as SNodeConfig.ParagraphConfig;
                return config;
            }
            break;
        }
    }

    return baseConfig;
}

export function deserialize(data: string): SNode {
    const config = JSON.parse(data) as SNodeConfig.Config;
    return deserializeFromConfig(config);
}

function deserializeFromConfig(config: SNodeConfig.Config): SNode {
    const node = new SNode();

    // 设置基本属性
    if (config.name) node.name = config.name;
    if (config.width !== undefined) node.width = config.width;
    if (config.height !== undefined) node.height = config.height;
    if (config.needClip !== undefined) node.needClip = config.needClip;
    if (config.active !== undefined) node.active = config.active;

    // 设置变换属性
    if (config.transform) {
        if (config.transform.position) {
            const pos = new Vec2(
                config.transform.position.x,
                config.transform.position.y
            );
            node.position.set(pos.x, pos.y);
        }
        if (config.transform.scale) {
            const scale = new Vec2(
                config.transform.scale.x,
                config.transform.scale.y
            );
            node.scale.set(scale.x, scale.y);
        }
        if (config.transform.rotation !== undefined) {
            node.rotation = config.transform.rotation;
        }
        if (config.transform.anchor) {
            const anchor = new Vec2(
                config.transform.anchor.x,
                config.transform.anchor.y
            );
            node.anchor.set(anchor.x, anchor.y);
        }
    }

    // 根据节点类型设置特定属性
    switch (config.type) {
        case SNodeConfig.NodeType.RECT: {
            const rectComp = node.addComponent(SGeoRect);
            const rectConfig = config as SNodeConfig.RectConfig;
            if (rectConfig.style) {
                rectComp.applyStyle(rectConfig);
            }
            break;
        }
        case SNodeConfig.NodeType.CIRCLE: {
            const circleComp = node.addComponent(SGeoEllipse);
            const circleConfig = config as SNodeConfig.CircleConfig;
            if (circleConfig.style) {
                circleComp.applyStyle(circleConfig);
            }
            break;
        }
        case SNodeConfig.NodeType.SPRITE: {
            const spriteComp = node.addComponent(SSprite);
            const spriteConfig = config as SNodeConfig.SpriteConfig;
            if (spriteConfig.url) {
                spriteComp.setImageByUrl(spriteConfig.url);
            }
            break;
        }
        case SNodeConfig.NodeType.PARAGRAPH: {
            const paraConfig = config as SNodeConfig.ParagraphConfig;
            node.addComponent(SParagraph, paraConfig);
            break;
        }
    }

    // 递归处理子节点
    if (config.children) {
        config.children.forEach((childConfig) => {
            const childNode = deserializeFromConfig(childConfig);
            node.addChild(childNode);
        });
    }

    return node;
}
