import { IPointData, TransformOptions } from '@/common/types';
import { SGraphics } from './SGraphics';
import SNode from './SNode';

export type SNodeConfig = {
    type: 'rect' | 'container';
    transform?: TransformOptions;
    props?: Record<string, any>;
    style?: Record<string, any>;
    children?: SNodeConfig[];
    name?: string;
    width?: number;
    height?: number;
    ref?: IRefSNode;
};

const nodeNameRefMap = new Map<string, SNode>();

export interface IRefSNode {
    value: SNode | undefined;
}

export function refSNode(v?: SNode): IRefSNode {
    const ref = {
        value: v,
    };
    return ref;
}

export function createNodeFromConfig(config: SNodeConfig): SNode {
    nodeNameRefMap.clear();
    return createNodeRecursive(config);
}

function createNodeRecursive(config: SNodeConfig): SNode {
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

    // 解析图形属性
    if (config.type === 'rect') {
        const graphics = new SGraphics();
        node.addRenderComps(graphics);
        graphics.rect(
            config.props?.x || 0,
            config.props?.y || 0,
            config.props?.width || 100,
            config.props?.height || 100
        );
        if (config.style?.fill) {
            graphics.fill({ color: config.style.fill });
        }
    }

    // 处理子元素
    config.children?.forEach(childConfig => {
        const childNode = createNodeFromConfig(childConfig);
        node.addChild(childNode);
    });

    return node;
}
