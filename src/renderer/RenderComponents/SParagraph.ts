import { Canvas, Paragraph, ParagraphBuilder } from 'canvaskit-wasm';
import { SRenderComponent } from './SRenderComponent';
import { CanvasKitModule } from '@/lib/canvaskit';

export class SParagraph extends SRenderComponent {
    private _text: string = '';

    private _paragraph: Paragraph | null = null;

    private _paragraphBuilder: ParagraphBuilder | null = null;

    get text() {
        return this._text;
    }

    set text(value: string) {
        this._text = value;
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
        this._paragraphBuilder.addText(this._text);
        this._paragraph = this._paragraphBuilder.build();

        this._paragraph.layout(this.node?.width ?? 10000);
        const height = this._paragraph.getHeight();
        const width = this._paragraph.getMaxWidth();
        if (this.node) {
            this.node.width = width;
            this.node.height = height;
        }
    }

    protected onCreated(): void {
        const paraStyle = new CanvasKitModule.CanvasKit.ParagraphStyle({
            textStyle: {
                color: CanvasKitModule.CanvasKit.BLACK,
                fontSize: 50,
                shadows: [
                    {
                        color: CanvasKitModule.CanvasKit.Color4f(0, 0, 0, 0.3),
                        offset: [2, 2],
                        blurRadius: 2,
                    },
                ],
                decoration: 0,
            },
            textAlign: CanvasKitModule.CanvasKit.TextAlign.Center,
        });
        const paragraphBuilder =
            CanvasKitModule.CanvasKit.ParagraphBuilder.Make(
                paraStyle,
                CanvasKitModule._fontMgr!
            );

        this._paragraphBuilder = paragraphBuilder;
        this._paragraph = paragraphBuilder.build();
        this._paragraph.layout(1000);
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
