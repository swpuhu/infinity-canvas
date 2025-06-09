import { SNodeConfig } from '../types';

declare global {
    namespace JSX {
        // 函数组件的类型
        type Element = SNodeConfig.Config;

        interface IntrinsicElements {
            sprite: Omit<SNodeConfig.SpriteConfig, 'type'>;
            container: Omit<SNodeConfig.ContainerConfig, 'type'>;
            rect: Omit<SNodeConfig.RectConfig, 'type'>;
            ellipse: Omit<SNodeConfig.EllipseConfig, 'type'>;
            para: Omit<SNodeConfig.ParagraphConfig, 'type'>;
            tri: Omit<SNodeConfig.TriConfig, 'type'>;
            diamond: Omit<SNodeConfig.DiamondConfig, 'type'>;
            parallelogram: Omit<SNodeConfig.ParallelogramConfig, 'type'>;
            roundRect: Omit<SNodeConfig.RoundRectConfig, 'type'>;
            'dash-line': Omit<SNodeConfig.DashLineConfig, 'type'>;
        }
    }
}
