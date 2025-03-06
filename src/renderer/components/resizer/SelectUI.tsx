import { SNodeConfig } from '@/common/types';
import { createElement } from '../../createElement';

export function SelectUI(style: SNodeConfig.SGraphicsStyleConfig) {
    return (
        <rect
            // active={false}
            width={100}
            transform={{
                anchor: {
                    x: 0,
                    y: 0,
                },
            }}
            height={100}
            style={{
                fill: style.fill,
                stroke: style.stroke,
                alpha: style.alpha,
                strokeWidth: style.strokeWidth,
            }}
        ></rect>
    );
}
