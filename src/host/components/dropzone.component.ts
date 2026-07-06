import { button, div, h1, input, p, styled } from "#/dom";
import { declaration, rule } from "@dropdeck/html/css";
import { githubBannerView } from "#/host/components/github-banner.component";

const ACCEPT = ".md,.markdown,.mdown,.mkd,text/markdown,text/plain,image/*";

export const dropzoneCss = [
    rule([".dropzone"], [
        declaration("position", "fixed"),
        declaration("inset", "0"),
        declaration("z-index", "200"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("align-items", "center"),
        declaration("justify-content", "center"),
        declaration("gap", "1.2rem"),
        declaration("background", "#f8fafc"),
        declaration("text-align", "center"),
        declaration("padding", "2rem")
    ]),
    rule([".dropzone.hidden"], [declaration("display", "none")]),
    rule([".drop-card"], [
        declaration("border", "0.125rem dashed rgba(15, 118, 110, 0.35)"),
        declaration("border-radius", "1.5rem"),
        declaration("padding", "clamp(2rem, 5vw, 4rem)"),
        declaration("background", "#fff"),
        declaration("box-shadow", "0 1.25rem 3.75rem rgba(15, 23, 42, 0.08)"),
        declaration("max-width", "41.25rem")
    ]),
    rule([".dropzone.dragging .drop-card"], [
        declaration("border-color", "#0f766e"),
        declaration("background", "#f0fdfa")
    ]),
    rule([".drop-title"], [
        declaration("font-family", "'DM Serif Display', Georgia, serif"),
        declaration("font-size", "clamp(1.8rem, 4vw, 2.8rem)"),
        declaration("color", "#0f172a"),
        declaration("margin", "0.4rem 0")
    ]),
    rule([".drop-sub"], [
        declaration("color", "#64748b"),
        declaration("font-size", "1.05rem"),
        declaration("max-width", "32rem"),
        declaration("margin", "0 auto"),
        declaration("line-height", "1.5")
    ]),
    rule([".drop-actions"], [
        declaration("display", "flex"),
        declaration("gap", "0.8rem"),
        declaration("justify-content", "center"),
        declaration("margin-top", "1.4rem"),
        declaration("flex-wrap", "wrap")
    ]),
    rule([".drop-btn"], [
        declaration("border", "none"),
        declaration("border-radius", "2rem"),
        declaration("padding", "0.7rem 1.4rem"),
        declaration("font-weight", "700"),
        declaration("font-size", "0.95rem"),
        declaration("cursor", "pointer"),
        declaration("font-family", "'Manrope', sans-serif")
    ]),
    rule([".drop-btn.primary"], [declaration("background", "#0f766e"), declaration("color", "#fff")]),
    rule([".drop-btn.ghost"], [declaration("background", "rgba(15, 118, 110, 0.1)"), declaration("color", "#0f766e")]),
    rule([".drop-hint"], [
        declaration("font-size", "0.8rem"),
        declaration("color", "#94a3b8"),
        declaration("margin-top", "1rem")
    ]),
    rule([".drop-examples"], [
        declaration("margin-top", "1.2rem"),
        declaration("border", "none"),
        declaration("background", "none"),
        declaration("color", "#64748b"),
        declaration("font-family", "'Manrope', sans-serif"),
        declaration("font-size", "0.85rem"),
        declaration("text-decoration", "underline"),
        declaration("cursor", "pointer")
    ])
] as const;

const dropzone = styled(
    div(
        { id: "drop", class: "dropzone" },
        div(
            { class: "drop-card" },
            div({ style: [declaration("font-size", "3rem"), declaration("line-height", "1")] }, "\u{1F4C4}"),
            h1({ class: "drop-title" }, "Drop your slides here"),
            p({ class: "drop-sub" }, "Drag a Markdown file onto this box -- or the whole folder, so its images come along. "
                + "Edit the text, drop it again, and the presentation updates. Refresh to pick a different deck."),
            div(
                { class: "drop-actions" },
                button({ type: "button", class: "drop-btn primary", id: "chooseFolderBtn" }, "Choose folder"),
                button({ type: "button", class: "drop-btn ghost", id: "chooseBtn" }, "Choose file")
            ),
            p({ class: "drop-hint" }, "Click the right side of a slide to advance, the left side to go back. Everything runs in your browser."),
            button({ type: "button", id: "examplesBtn", class: "drop-examples" }, "Browse examples")
        ),
        input({ type: "file", id: "fileInput", accept: ACCEPT, multiple: true, hidden: true }),
        input({ type: "file", id: "folderInput", webkitdirectory: true, hidden: true }),
        githubBannerView()
    ),
    dropzoneCss,
    ["hidden", "dragging"]
);

export function dropzoneView(): typeof dropzone.tree {
    return dropzone.tree;
}
