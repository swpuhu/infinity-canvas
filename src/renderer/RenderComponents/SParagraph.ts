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
    EnumParaLayoutMode,
    EnumParaResizeMode,
    EnumRenderComponentType,
    SNodeConfig,
} from '@/common/types';
import { ReadonlyVec2 } from 'gl-matrix';

export class SParagraph extends SRenderComponent {
    private _text: string = '';

    private _paragraph: Paragraph | null = null;

    private _paragraphBuilder: ParagraphBuilder | null = null;

    private _paraStyle: ParagraphStyle | null = null;

    private _fontSize: number = 50;

    private _heightMultiplier: number = 1.4;

    private _layoutMode: EnumParaLayoutMode = EnumParaLayoutMode.AUTO;

    private _resizeMode: EnumParaResizeMode =
        EnumParaResizeMode.RESIZE_FONT_SIZE;

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

    constructor(props?: SNodeConfig.SParagraphPropsConfig) {
        super();
        this._text = props?.text || '';
        this._fontSize = props?.fontSize || 50;
        this._layoutMode = props?.layoutMode || EnumParaLayoutMode.AUTO;
        this._resizeMode =
            props?.resizeMode || EnumParaResizeMode.RESIZE_FONT_SIZE;
    }

    public setFontSize(size: number) {
        this._fontSize = size;
        this.resetBuilder();
    }

    private resetBuilder() {
        if (!this._paragraphBuilder || !this.node) {
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

        let width = this.node.width;
        if (this._layoutMode === EnumParaLayoutMode.AUTO) {
            this._paragraph.layout(10000);
            width = this._paragraph.getMaxIntrinsicWidth();
        } else {
            this._paragraph.layout(this.node.width);
        }
        const height = this._paragraph.getHeight();
        this.node.width = width;
        this.node.height = height;
    }

    private _nodeSizeChanged = (width: number, height: number) => {
        if (!this.node) {
            return;
        }
        this.node.width = width;
        this.node.height = height;
        if (this._resizeMode === EnumParaResizeMode.RESIZE_FONT_SIZE) {
            const currentLines = this._paragraph?.getLineMetrics();
            if (!currentLines) {
                return;
            }
            const newFontSize =
                height / this._heightMultiplier / currentLines.length;

            this.setFontSize(Math.floor(newFontSize));
        } else {
            this._paragraph?.layout(width);
        }
    };

    public setSelectionRange(startIndex: number, endIndex: number) {
        let _startIndex = startIndex;
        let _endIndex = endIndex;
        this._selectedRange.startIndex = _startIndex;
        this._selectedRange.endIndex = _endIndex;
    }

    public unSelect() {
        this._selectedRange.startIndex = -1;
        this._selectedRange.endIndex = -1;
    }

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
        this.node.setSize = (width, height) => {
            this._nodeSizeChanged(width, height);
        };
        this.node.renderType = EnumRenderComponentType.TEXT;
        this.resetBuilder();
    }

    public getCursorInfoByIndex(cursorIndex: number): {
        pos: ReadonlyVec2;
        endPos: ReadonlyVec2;
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

        console.log('isLastChar', isLastChar);
        if (isLastChar) {
            const info = {
                pos: [rects[0].rect[2], rects[0].rect[1]],
                size: rects[0].rect[3] - rects[0].rect[1],
                endPos: [rects[0].rect[2], rects[0].rect[3]],
                startIndex: cursorIndex,
                endIndex: cursorIndex,
            };

            const lastLineMetrics = lineMetrics[lineMetrics.length - 1];
            if (lastLineMetrics.width === 0) {
                info.pos = [
                    0,
                    this._fontSize *
                        this._heightMultiplier *
                        (lineMetrics.length - 1),
                ];
                info.size = this._fontSize * this._heightMultiplier;
            }

            return info as any;
        }

        return {
            pos: [rects[0].rect[0], rects[0].rect[1]],
            size: rects[0].rect[3] - rects[0].rect[1],
            endPos: [rects[0].rect[0], rects[0].rect[3]],
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

    public drawSelectionBlock(canvas: Canvas): void {
        if (!this._paragraph) {
            return;
        }
        const rects = this._paragraph.getRectsForRange(
            this._selectedRange.startIndex,
            this._selectedRange.endIndex,
            CanvasKitModule.CanvasKit.RectHeightStyle.Tight,
            CanvasKitModule.CanvasKit.RectWidthStyle.Tight
        );

        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            canvas.drawRect(rect.rect, CanvasKitModule.getTextSelectionPaint());
        }
    }

    public draw(canvas: Canvas): void {
        if (!this._paragraph) {
            return;
        }
        if (!this.node) {
            return;
        }
        this.drawSelectionBlock(canvas);
        canvas.drawParagraph(
            this._paragraph,
            -this.node.width * this.node.anchor.x,
            -this.node.height * this.node.anchor.y
        );
    }
}
