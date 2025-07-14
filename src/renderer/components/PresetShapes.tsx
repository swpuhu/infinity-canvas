import { SNodeConfig } from '@/common/types';
import { CanvasEditor } from '../Editor';
import SNode from '../SNode';
import { createElement } from '../createElement';
import { DEFAULT_SHADOW_SHAPE_STYLE } from '@/common/const';
import { createNodeFromConfig } from '../util';

const presetShapeKeys: SNodeConfig.NodeType[] = [
    SNodeConfig.NodeType.RECT,
    SNodeConfig.NodeType.TRI,
    SNodeConfig.NodeType.ELLIPSE,
    SNodeConfig.NodeType.DIAMOND,
    SNodeConfig.NodeType.PARALLELOGRAM,
    SNodeConfig.NodeType.ARROW,
];

class PresetShapes {
    private _presetShapes: Partial<Record<SNodeConfig.NodeType, SNode>> = {};
    private _presetShapeConfigs: Partial<
        Record<SNodeConfig.NodeType, SNodeConfig.Config>
    > = {};

    // 动态添加的形状节点属性类型声明
    readonly rect!: SNode;
    readonly tri!: SNode;
    readonly ellipse!: SNode;
    readonly diamond!: SNode;
    readonly parallelogram!: SNode;
    readonly arrow!: SNode;
    readonly container!: SNode;

    // 动态添加的形状配置属性类型声明
    readonly rectConfig!: SNodeConfig.RectConfig;
    readonly triConfig!: SNodeConfig.TriConfig;
    readonly ellipseConfig!: SNodeConfig.EllipseConfig;
    readonly diamondConfig!: SNodeConfig.DiamondConfig;
    readonly parallelogramConfig!: SNodeConfig.ParallelogramConfig;
    readonly arrowConfig!: SNodeConfig.ArrowConfig;

    constructor() {
        for (let i = 0; i < presetShapeKeys.length; i++) {
            const key = presetShapeKeys[i];
            Object.defineProperty(this, key, {
                get: () => {
                    let node = this._presetShapes[key];
                    if (!node) {
                        const config = this.getPresetShapeConfig(key);
                        node = createNodeFromConfig(config);
                    }
                    return node;
                },
            });
            Object.defineProperty(this, key + 'Config', {
                get: () => {
                    return this.getPresetShapeConfig(key);
                },
            });
        }
    }

    public getPresetShapeConfig(key: SNodeConfig.NodeType) {
        const config = this._presetShapeConfigs[key];
        if (config) {
            return config;
        }
        switch (key) {
            case SNodeConfig.NodeType.TRI:
                return (
                    <tri
                        width={100}
                        height={100}
                        style={DEFAULT_SHADOW_SHAPE_STYLE}
                    />
                );
            case SNodeConfig.NodeType.ELLIPSE:
                return (
                    <ellipse
                        width={100}
                        height={100}
                        style={DEFAULT_SHADOW_SHAPE_STYLE}
                    />
                );
            case SNodeConfig.NodeType.DIAMOND:
                return (
                    <diamond
                        width={100}
                        height={100}
                        style={DEFAULT_SHADOW_SHAPE_STYLE}
                    />
                );
            case SNodeConfig.NodeType.PARALLELOGRAM:
                return (
                    <parallelogram
                        width={100}
                        height={100}
                        style={DEFAULT_SHADOW_SHAPE_STYLE}
                    />
                );
            case SNodeConfig.NodeType.ARROW:
                return (
                    <arrow
                        width={100}
                        height={100}
                        style={DEFAULT_SHADOW_SHAPE_STYLE}
                    />
                );
            default:
            case SNodeConfig.NodeType.RECT:
                return (
                    <rect
                        width={100}
                        height={100}
                        style={DEFAULT_SHADOW_SHAPE_STYLE}
                    />
                );
        }
    }
}

const presetShapes = new PresetShapes();

export default presetShapes;
