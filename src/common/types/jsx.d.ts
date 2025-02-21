import { SNodeConfig } from '../types';

declare global {
    namespace JSX {
        interface ElementClass {
            render(): SNodeConfig.Config;
        }

        interface ElementChildrenAttribute {
            children: {}; // 指定 children 属性名
        }

        // 函数组件的类型
        type Element = SNodeConfig.Config;

        interface IntrinsicElements {
            sprite: Omit<SNodeConfig.SpriteConfig, 'type'>;
            container: Omit<SNodeConfig.ContainerConfig, 'type'>;
            rect: Omit<SNodeConfig.RectConfig, 'type'>;
            circle: Omit<SNodeConfig.CircleConfig, 'type'>;
        }
    }
}
