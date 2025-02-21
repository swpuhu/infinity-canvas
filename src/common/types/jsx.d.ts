import { SNodeConfig } from '../types';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            sprite: Omit<SNodeConfig.SpriteConfig, 'type'>;
            container: Omit<SNodeConfig.ContainerConfig, 'type'>;
            rect: Omit<SNodeConfig.RectConfig, 'type'>;
            circle: Omit<SNodeConfig.CircleConfig, 'type'>;
        }
    }
}
