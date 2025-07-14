import { Pool } from '@/common/Pool';
import { IPointData, SNodeConfig } from '@/common/types';
import { InputRect } from 'canvaskit-wasm';
import { vec2 } from 'gl-matrix';
import { SGeoEllipse } from './Geometry/SGeoEllipse';
import { SGeoDashLine } from './Geometry/SGeoDashLine';
import { SGeoRect } from './Geometry/SGeoRect';
import { SParagraph } from './RenderComponents/SParagraph';
import { SSprite } from './RenderComponents/SSprite';
import SNode from './SNode';
import { SGeoTri } from './Geometry/SGeoTri';
import { SGeoDiamond } from './Geometry/SGeoDiamond';
import { SGeoParallelogram } from './Geometry/SGeoParallelogram';
import { SGeoArrow } from './Geometry/SGeoArrow';
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
    } else if (config.type === SNodeConfig.NodeType.DASH_LINE) {
        const dashLineConfig = config as SNodeConfig.DashLineConfig;
        const dashLine = node.addComponent(SGeoDashLine);
        dashLine.applyStyle(dashLineConfig);
    } else if (config.type === SNodeConfig.NodeType.SPRITE) {
        const spriteConfig = config as SNodeConfig.SpriteConfig;
        const sprite = node.addComponent(SSprite);
        sprite.setImageByUrl(spriteConfig.url || '');
    } else if (config.type === SNodeConfig.NodeType.PARAGRAPH) {
        const paragraphConfig = config as SNodeConfig.ParagraphConfig;
        node.addComponent(SParagraph, paragraphConfig);
    } else if (config.type === SNodeConfig.NodeType.TRI) {
        const triConfig = config as SNodeConfig.TriConfig;
        const tri = node.addComponent(SGeoTri);
        tri.applyStyle(triConfig);
    } else if (config.type === SNodeConfig.NodeType.ELLIPSE) {
        const ellipseConfig = config as SNodeConfig.EllipseConfig;
        const ellipse = node.addComponent(SGeoEllipse);
        ellipse.applyStyle(ellipseConfig);
    } else if (config.type === SNodeConfig.NodeType.DIAMOND) {
        const diamondConfig = config as SNodeConfig.DiamondConfig;
        const diamond = node.addComponent(SGeoDiamond);
        diamond.applyStyle(diamondConfig);
    } else if (config.type === SNodeConfig.NodeType.PARALLELOGRAM) {
        const parallelogramConfig = config as SNodeConfig.ParallelogramConfig;
        const parallelogram = node.addComponent(SGeoParallelogram);
        parallelogram.applyStyle(parallelogramConfig);
    } else if (config.type === SNodeConfig.NodeType.ARROW) {
        const arrowConfig = config as SNodeConfig.ArrowConfig;
        const arrow = node.addComponent(SGeoArrow);
        arrow.applyStyle(arrowConfig);
    }
    // 处理子元素
    config.children?.forEach((childConfig) => {
        const childNode = createNodeFromConfig(childConfig);
        node.addChild(childNode);
    });

    return node;
}

export function getRectByNode(node: SNode): number[] {
    return [
        -node.width * node.anchor.x,
        -node.height * node.anchor.y,
        node.width * (1 - node.anchor.x),
        node.height * (1 - node.anchor.y),
    ];
}

export function alignToNode(
    srcNode: SNode,
    targetNode: SNode,
    alignSize = false
) {
    if (alignSize) {
        srcNode.setSize(targetNode.width, targetNode.height);
    }
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

export function getWorldRect(nodes: SNode[]): number[] {
    const worldRects = nodes.map((node) => node.getWorldPoints());
    const allPoints = worldRects.flatMap((rect) => rect);

    const allX = allPoints.map(([x, y]) => x);
    const allY = allPoints.map(([x, y]) => y);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);

    return [minX, minY, maxX, maxY];
}

export function cloneNodesAndMoveIn(
    srcs: SNode[],
    target: SNode,
    pool: Pool<SNode>
): SNode[] {
    return srcs.map((node) => {
        const dummyNode = pool.get();
        dummyNode.width = node.width;
        dummyNode.height = node.height;
        // Debug
        // const rect = dummyNode.addComponent(SGeoRect);
        // rect.applyStyle({
        //     props: {
        //         width: node.width,
        //         height: node.height,
        //     },

        //     style: {
        //         fill: 0xffbbcc,
        //     },
        // });

        dummyNode.anchor.set(node.anchor.x, node.anchor.y);
        dummyNode.setParent(node);
        dummyNode.moveInto(target);
        return dummyNode;
    });
}
