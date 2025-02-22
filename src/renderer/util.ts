import { IPointData, SNodeConfig } from '@/common/types';
import SNode from './SNode';
import { SSprite } from './RenderComponents/SSprite';
import { InputRect } from 'canvaskit-wasm';
import { SGeoRect } from './Geometry/SGeoRect';
import { Vec2 } from '@/common/Vec2';
import { vec2 } from 'gl-matrix';
import { SGeoCircle } from './Geometry/SGeoCircle';
import { SParagraph } from './RenderComponents/SParagraph';
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
    if (config.active !== undefined) {
        node.active = config.active;
    }
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
        const rect = node.addComponent(SGeoRect);
        rect.applyStyle(rectConfig);
    } else if (config.type === SNodeConfig.NodeType.CIRCLE) {
        const circleConfig = config as SNodeConfig.CircleConfig;
        const circle = node.addComponent(SGeoCircle);
        circle.applyStyle(circleConfig);
    } else if (config.type === SNodeConfig.NodeType.SPRITE) {
        const spriteConfig = config as SNodeConfig.SpriteConfig;
        const sprite = node.addComponent(SSprite);
        sprite.setImageByUrl(spriteConfig.url || '');
    } else if (config.type === SNodeConfig.NodeType.PARAGRAPH) {
        const paragraphConfig = config as SNodeConfig.ParagraphConfig;
        node.addComponent(SParagraph, paragraphConfig);
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

export function alignToNode(srcNode: SNode, targetNode: SNode) {
    srcNode.setSize(targetNode.width, targetNode.height);
    srcNode.anchor.set(targetNode.anchor.x, targetNode.anchor.y);

    const targetNodeMat = targetNode.getWorldMatrix();
    srcNode.setWorldMatrix(targetNodeMat);
}

const tempVec2 = vec2.create();
export function changeAnchorButStay(node: SNode, anchor: IPointData) {
    const currentAnchor = node.anchor;
    const diffAnchorX = anchor.x - currentAnchor.x;
    const diffAnchorY = anchor.y - currentAnchor.y;

    const diffInParent = vec2.transformMat3(
        tempVec2,
        [node.width * diffAnchorX, node.height * diffAnchorY],
        node.getLocalMatrix()
    );
    node.position.set(diffInParent[0], diffInParent[1]);
    node.anchor.set(anchor.x, anchor.y);
}
