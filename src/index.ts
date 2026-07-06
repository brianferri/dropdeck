import { body, head, html, link, meta, script, serialize, style, title } from "#/dom";
import { serialize as serializeCss } from "@dropdeck/html/css";
import { dropzoneCss, dropzoneView } from "#/host/components/dropzone.component";
import { editorCss, editorPopupCss, editorTokenCss, editorView } from "#/host/components/editor.component";
import { exportBarCss, exportBarView } from "#/host/components/export-bar.component";
import { spotlightCss, spotlightView } from "#/host/components/spotlight.component";
import { stageCss, stageView } from "#/host/components/stage.component";
import { rootStyle } from "#/styles/root.style";
import { baseStyle } from "#/styles/base.style";
import { slideStyle } from "#/styles/slide.style";
import { typographyStyle } from "#/styles/typography.style";
import { blocksStyle } from "#/styles/blocks.style";
import { ambientStyle } from "#/styles/ambient.style";
import { animationStyle } from "#/styles/animation.style";
import { printStyle } from "#/styles/print.style";

const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800"
    + "&family=DM+Serif+Display&family=Fira+Code&display=swap";

export function renderPage(): string {
    const document = html(
        // Light is the `:root` default; `applyConfig` adds `data-theme="dark"` when a dark deck loads.
        { lang: "en" },
        head(
            {},
            meta({ charset: "UTF-8" }),
            meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
            title({}, "dropdeck"),
            link({ rel: "preconnect", href: "https://fonts.googleapis.com" }),
            link({ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true }),
            link({ rel: "stylesheet", href: FONTS }),
            style({ id: "dropdeck-root" }, serializeCss(rootStyle)),
            style({ id: "dropdeck-base" }, serializeCss(baseStyle)),
            style({ id: "dropdeck-slide" }, serializeCss(slideStyle)),
            style({ id: "dropdeck-typography" }, serializeCss(typographyStyle)),
            style({ id: "dropdeck-blocks" }, serializeCss(blocksStyle)),
            style({ id: "dropdeck-ambient" }, serializeCss(ambientStyle)),
            style({ id: "dropdeck-animation" }, serializeCss(animationStyle)),
            style({ id: "dropdeck-spotlight" }, serializeCss(spotlightCss)),
            style({ id: "dropdeck-stage" }, serializeCss(stageCss)),
            style({ id: "dropdeck-export-bar" }, serializeCss(exportBarCss)),
            style({ id: "dropdeck-dropzone" }, serializeCss(dropzoneCss)),
            style({ id: "dropdeck-editor" }, serializeCss(editorCss)),
            style({ id: "dropdeck-editor-tokens" }, serializeCss(editorTokenCss)),
            style({ id: "dropdeck-editor-popup" }, serializeCss(editorPopupCss)),
            style({ id: "dropdeck-print" }, serializeCss(printStyle))
        ),
        body(
            {},
            spotlightView(),
            exportBarView(),
            editorView(),
            stageView(),
            dropzoneView(),
            script({ id: "deck-source", type: "application/octet-stream" }),
            script({ type: "module", src: "/src/main.ts" })
        )
    );
    return `<!DOCTYPE html>${serialize(document)}`;
}
