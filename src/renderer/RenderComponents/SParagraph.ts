import {
    Canvas,
    Paragraph,
    ParagraphBuilder,
    ParagraphStyle,
    Rect,
} from 'canvaskit-wasm';
import { SRenderComponent } from './SRenderComponent';
import { CanvasKitModule } from '@/lib/canvaskit';
import {
    EnumAspectKeepMode,
    EnumRenderComponentType,
    SNodeEvents,
} from '@/common/types';
import { Vec2 } from '@/common/Vec2';
import { ReadonlyVec2 } from 'gl-matrix';

export class SParagraph extends SRenderComponent {
    private _text: string = '';

    private _paragraph: Paragraph | null = null;

    private _paragraphBuilder: ParagraphBuilder | null = null;

    private _paraStyle: ParagraphStyle | null = null;

    private _fontSize: number = 50;

    private _heightMultiplier: number = 1.4;

    private _selectedRange: {
        startIndex: number;
        endIndex: number;
    } = {
        startIndex: -1,
        endIndex: -1,
    };

    get text() {
        return this._text;
    }

    set text(value: string) {
        this._text = value;
        this.resetBuilder();
    }

    public setFontSize(size: number) {
        this._fontSize = size;
        this.resetBuilder();
    }

    private resetBuilder() {
        if (!this._paragraphBuilder) {
            return;
        }
        if (this._paragraph) {
            this._paragraph.delete();
        }
        this._paragraphBuilder.reset();

        if (this._paraStyle?.textStyle?.fontSize !== this._fontSize) {
            const textStyle = new CanvasKitModule.CanvasKit.TextStyle({
                fontSize: this._fontSize,
                heightMultiplier: this._heightMultiplier,
            });
            this._paragraphBuilder.pushStyle(textStyle);
        }

        this._paragraphBuilder.addText(this._text);
        // this._paragraphBuilder.pop();
        this._paragraph = this._paragraphBuilder.build();

        this._paragraph.layout(10000);
        const height = this._paragraph.getHeight();
        const width = this._paragraph.getMaxIntrinsicWidth();
        // this._paragraph.layout(width);
        // console.log('width', width, 'height', height);
        if (this.node) {
            this.node.width = width;
            this.node.height = height;
        }
    }

    private _nodeSizeChanged = () => {
        if (!this.node) {
            return;
        }
        const currentLines = this._paragraph?.getLineMetrics();
        if (!currentLines) {
            return;
        }
        const newFontSize =
            this.node.height / this._heightMultiplier / currentLines.length;

        this.setFontSize(Math.floor(newFontSize));
    };

    protected onCreated(): void {
        const paraStyle = new CanvasKitModule.CanvasKit.ParagraphStyle({
            textStyle: {
                color: CanvasKitModule.CanvasKit.BLACK,
                fontSize: this._fontSize,
                heightMultiplier: this._heightMultiplier,
            },
        });
        const paragraphBuilder =
            CanvasKitModule.CanvasKit.ParagraphBuilder.Make(
                paraStyle,
                CanvasKitModule._fontMgr!
            );
        this._paraStyle = paraStyle;
        this._paragraphBuilder = paragraphBuilder;
        this._paragraph = paragraphBuilder.build();
        this._paragraph.layout(1000);
        if (!this.node) {
            return;
        }
        this.node.aspectKeepMode = EnumAspectKeepMode.HEIGHT;
        this.node.on(SNodeEvents.SIZE_CHANGE, this._nodeSizeChanged);
        this.node.renderType = EnumRenderComponentType.TEXT;
    }

    public getCursorInfoByIndex(cursorIndex: number): {
        pos: ReadonlyVec2;
        size: number;
        startIndex: number;
        endIndex: number;
    } | null {
        if (!this._paragraph) {
            return null;
        }
        const lineMetrics = this._paragraph.getLineMetrics();
        if (!lineMetrics.length) {
            return null;
        }
        const isLastChar =
            cursorIndex === lineMetrics[lineMetrics.length - 1].endIndex;

        let currentLine = lineMetrics[0];
        for (let i = 1; i < lineMetrics.length; i++) {
            if (
                cursorIndex >= lineMetrics[i].startIndex &&
                cursorIndex <= lineMetrics[i].endIndex
            ) {
                currentLine = lineMetrics[i];
                break;
            }
        }

        const rects = this._paragraph.getRectsForRange(
            isLastChar ? cursorIndex - 1 : cursorIndex,
            isLastChar ? cursorIndex : cursorIndex + 1,
            CanvasKitModule.CanvasKit.RectHeightStyle.Tight,
            CanvasKitModule.CanvasKit.RectWidthStyle.Tight
        );

        console.log(rects);
        if (isLastChar) {
            return {
                pos: [rects[0].rect[2], rects[0].rect[1]],
                size: rects[0].rect[3] - rects[0].rect[1],
                startIndex: cursorIndex,
                endIndex: cursorIndex,
            };
        }

        return {
            pos: [rects[0].rect[0], rects[0].rect[1]],
            size: rects[0].rect[3] - rects[0].rect[1],
            startIndex: cursorIndex,
            endIndex: cursorIndex,
        };
    }

    public getCursorIndex(dx: number, dy: number): number {
        if (!this._paragraph) {
            return -1;
        }
        const info = this._paragraph.getGlyphPositionAtCoordinate(dx, dy);
        return info.pos;
    }

    public draw(canvas: Canvas): void {
        if (!this._paragraph) {
            return;
        }
        if (!this.node) {
            return;
        }
        canvas.drawParagraph(
            this._paragraph,
            -this.node.width * this.node.anchor.x,
            -this.node.height * this.node.anchor.y
        );
    }
}
