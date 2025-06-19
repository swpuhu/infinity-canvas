import { SNodeConfig } from '@/common/types';

export function createElement<T extends keyof JSX.IntrinsicElements>(
    type: T,
    props: JSX.IntrinsicElements[T],
    ...children: JSX.Element[]
): SNodeConfig.Config {
    // 如果是函数组件（首字母大写）
    if (typeof type === 'function') {
        return (type as any)(props, ...children);
    }
    const config: SNodeConfig.Config = {
        type: type as SNodeConfig.NodeType,
        ...props,
        children: children.flat(Infinity).filter(Boolean),
    };

    return config as T extends 'sprite'
        ? SNodeConfig.SpriteConfig
        : T extends 'rect'
        ? SNodeConfig.RectConfig
        : T extends 'container'
        ? SNodeConfig.ContainerConfig
        : T extends 'circle'
        ? SNodeConfig.EllipseConfig
        : T extends 'dash-line'
        ? SNodeConfig.DashLineConfig
        : never;
}
