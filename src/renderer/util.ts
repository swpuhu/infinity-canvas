import { SGraphics } from './SGraphics';
import SNode from './SNode';

// 新增类型定义和解析器（可以放在单独文件）
export type SNodeConfig = {
    type: 'rect' | 'container';
    props?: Record<string, any>;
    style?: Record<string, any>;
    children?: SNodeConfig[];
};

export function createNodeFromConfig(config: SNodeConfig): SNode {
    const node = new SNode();
    const graphics = new SGraphics();

    // 解析图形属性
    if (config.type === 'rect') {
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

    node.addRenderComps(graphics);
    return node;
}
