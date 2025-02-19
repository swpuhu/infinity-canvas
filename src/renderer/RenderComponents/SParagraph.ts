import {
    Canvas,
    Paragraph,
    ParagraphBuilder,
    ParagraphStyle,
} from 'canvaskit-wasm';
import { SRenderComponent } from './SRenderComponent';
import { CanvasKitModule } from '@/lib/canvaskit';
import { EnumAspectKeepMode, SNodeEvents } from '@/common/types';

export class SParagraph extends SRenderComponent {
    private _text: string = '';

    private _paragraph: Paragraph | null = null;

    private _paragraphBuilder: ParagraphBuilder | null = null;

    private _paraStyle: ParagraphStyle | null = null;

    private _fontSize: number = 50;

    private _heightMultiplier: number = 1.4;

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
