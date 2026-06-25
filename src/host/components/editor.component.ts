import { div, pre, span, styled, textarea } from "#/dom";
import { declaration, rule } from "@dropdeck/html/css";
import { keysOf } from "#/support";
import type { DomNode } from "#/dom";
import type { CompletionItem } from "#/host/language";

export const editorCss = [
    // The deck shifts right by `--editor-width`; the panel and the stage's centre both read that one var.
    rule(["#editor"], [
        declaration("position", "fixed"),
        declaration("left", "0"),
        declaration("top", "0"),
        declaration("bottom", "0"),
        declaration("width", "var(--editor-width, 0px)"),
        declaration("z-index", "130"),
        declaration("display", "flex"),
        declaration("background", "#0b1220"),
        declaration("box-shadow", "0.5rem 0 2rem rgba(0, 0, 0, 0.35)")
    ]),
    rule(["#editor.hidden"], [declaration("display", "none")]),
    rule(["#editorBody"], [
        declaration("flex", "1"),
        declaration("min-width", "0"),
        declaration("display", "flex"),
        declaration("flex-direction", "column")
    ]),
    rule(["#editorScroll"], [
        declaration("position", "relative"),
        declaration("flex", "1"),
        declaration("min-height", "0")
    ]),
    rule(["#editorHighlight", "#editorText"], [
        declaration("position", "absolute"),
        declaration("inset", "0"),
        declaration("margin", "0"),
        declaration("padding", "1.25rem"),
        declaration("border", "none"),
        declaration("font-family", "'Fira Code', ui-monospace, monospace"),
        declaration("font-size", "0.82rem"),
        declaration("line-height", "1.6"),
        declaration("tab-size", "2"),
        declaration("white-space", "pre-wrap"),
        declaration("word-break", "break-word"),
        declaration("box-sizing", "border-box"),
        declaration("scrollbar-gutter", "stable")
    ]),
    rule(["#editorHighlight"], [
        declaration("pointer-events", "none"),
        declaration("overflow", "hidden"),
        declaration("color", "#e6edf3"),
        declaration("z-index", "0")
    ]),
    rule(["#editorText"], [
        declaration("overflow", "auto"),
        declaration("resize", "none"),
        declaration("outline", "none"),
        declaration("background", "transparent"),
        declaration("color", "transparent"),
        declaration("caret-color", "#e6edf3"),
        declaration("z-index", "1")
    ]),
    rule(["#editorError"], [
        declaration("padding", "0.5rem 1.25rem"),
        declaration("background", "rgba(220, 38, 38, 0.16)"),
        declaration("color", "#fca5a5"),
        declaration("font-family", "'Fira Code', ui-monospace, monospace"),
        declaration("font-size", "0.75rem"),
        declaration("white-space", "pre-wrap")
    ]),
    rule(["#editorError:empty"], [declaration("display", "none")]),
    rule(["#editorGutter"], [
        declaration("flex", "0 0 0.75rem"),
        declaration("align-self", "stretch"),
        declaration("display", "flex"),
        declaration("align-items", "center"),
        declaration("justify-content", "center"),
        declaration("cursor", "col-resize"),
        declaration("background", "rgba(255, 255, 255, 0.04)")
    ]),
    rule(["#editorGutter::before"], [
        declaration("content", "\"\""),
        declaration("width", "0.25rem"),
        declaration("height", "3rem"),
        declaration("border-radius", "1rem"),
        declaration("background", "rgba(255, 255, 255, 0.22)"),
        declaration("transition", "background 0.15s, height 0.15s")
    ]),
    rule(["#editorGutter:hover::before"], [
        declaration("background", "#5cd0b3"),
        declaration("height", "5.625rem")
    ]),
    rule(["#editorGutter.active::before"], [
        declaration("background", "#5cd0b3"),
        declaration("height", "5.625rem")
    ]),
    // Anchored at the caret by `mountEditor`; absolute within #editorScroll so it tracks the scrolled text.
    rule(["#editorPopup"], [
        declaration("position", "absolute"),
        declaration("z-index", "5"),
        declaration("min-width", "16vw"),
        declaration("max-height", "40vh"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("overflow", "hidden"),
        declaration("background", "#111a2b"),
        declaration("border", "0.0625rem solid rgba(255, 255, 255, 0.12)"),
        declaration("border-radius", "0.5rem"),
        declaration("box-shadow", "0 0.75rem 2rem rgba(0, 0, 0, 0.45)"),
        declaration("font-family", "'Fira Code', ui-monospace, monospace"),
        declaration("font-size", "0.78rem")
    ]),
    rule(["#editorPopup.hidden"], [declaration("display", "none")]),
    rule(["#editorPopupHint"], [
        declaration("flex", "none"),
        declaration("display", "flex"),
        declaration("flex-wrap", "wrap"),
        declaration("align-items", "center"),
        declaration("gap", "0.4rem"),
        declaration("padding", "0.35rem 0.5rem"),
        declaration("border-bottom", "0.0625rem solid rgba(255, 255, 255, 0.1)"),
        declaration("font-size", "0.68rem"),
        declaration("color", "#7e8ca0")
    ]),
    rule(["#editorPopupList"], [
        declaration("position", "relative"),
        declaration("overflow-y", "auto"),
        declaration("padding", "0.25rem")
    ]),
    rule(["#editorTooltip"], [
        declaration("position", "absolute"),
        declaration("z-index", "6"),
        declaration("max-width", "24vw"),
        declaration("padding", "0.5rem 0.625rem"),
        declaration("background", "#111a2b"),
        declaration("border", "0.0625rem solid rgba(255, 255, 255, 0.12)"),
        declaration("border-radius", "0.5rem"),
        declaration("box-shadow", "0 0.75rem 2rem rgba(0, 0, 0, 0.45)"),
        declaration("font-family", "'Fira Code', ui-monospace, monospace"),
        declaration("font-size", "0.75rem"),
        declaration("pointer-events", "none")
    ]),
    rule(["#editorTooltip.hidden"], [declaration("display", "none")]),
    rule(["#editorCompletionDoc"], [
        declaration("position", "absolute"),
        declaration("z-index", "5"),
        declaration("width", "22vw"),
        declaration("max-height", "40vh"),
        declaration("overflow-y", "auto"),
        declaration("padding", "0.5rem 0.625rem"),
        declaration("background", "#111a2b"),
        declaration("border", "0.0625rem solid rgba(255, 255, 255, 0.12)"),
        declaration("border-radius", "0.5rem"),
        declaration("box-shadow", "0 0.75rem 2rem rgba(0, 0, 0, 0.45)"),
        declaration("font-family", "'Fira Code', ui-monospace, monospace"),
        declaration("font-size", "0.75rem")
    ]),
    rule(["#editorCompletionDoc.hidden"], [declaration("display", "none")])
] as const;

const tokenStyles = {
    separator: [declaration("color", "#ff7b72")],
    heading: [declaration("color", "#79c0ff"), declaration("font-weight", "700")],
    fence: [declaration("color", "#a5d6ff")],
    directive: [declaration("color", "#d2a8ff")],
    quote: [declaration("color", "#8b949e"), declaration("font-style", "italic")],
    list: [declaration("color", "#ffa657")],
    image: [declaration("color", "#a5d6ff")],
    link: [declaration("color", "#a5d6ff")],
    bold: [declaration("color", "#e6edf3"), declaration("font-weight", "700")],
    italic: [declaration("color", "#e6edf3"), declaration("font-style", "italic")],
    code: [declaration("color", "#a5d6ff")],
    html: [declaration("color", "#7ee787")],
    // Background and ink are set inline per hex; rounding alone makes the run read as a swatch, not painted text.
    color: [declaration("border-radius", "0.2em")]
} as const;

export type TokenClass = keyof typeof tokenStyles;
export const editorTokenCss = keysOf(tokenStyles).map((key) => rule([`#editorHighlight .tok-${key}`], tokenStyles[key]));

export const editorPopupCss = [
    rule([".completion-item"], [
        declaration("display", "flex"),
        declaration("justify-content", "space-between"),
        declaration("gap", "1rem"),
        declaration("padding", "0.25rem 0.5rem"),
        declaration("border-radius", "0.3rem"),
        declaration("cursor", "pointer"),
        declaration("white-space", "nowrap")
    ]),
    rule([".completion-item.active"], [declaration("background", "rgba(92, 208, 179, 0.18)")]),
    rule([".cmp-key"], [
        declaration("background", "rgba(255, 255, 255, 0.1)"),
        declaration("border-radius", "0.25rem"),
        declaration("padding", "0 0.3rem"),
        declaration("color", "#e6edf3")
    ]),
    rule([".completion-label"], [declaration("color", "#e6edf3")]),
    rule([".completion-detail"], [declaration("color", "#7e8ca0")]),
    rule([".tooltip-title"], [
        declaration("display", "block"),
        declaration("margin-bottom", "0.25rem"),
        declaration("color", "#5cd0b3"),
        declaration("font-weight", "700")
    ]),
    rule([".tooltip-doc"], [
        declaration("display", "block"),
        declaration("color", "#aab6c4"),
        declaration("line-height", "1.5")
    ])
] as const;

export function completionItemView(item: CompletionItem, index: number, active: boolean): DomNode {
    return div(
        { class: active ? "completion-item active" : "completion-item", data: { index: String(index) } },
        span({ class: "completion-label" }, item.label),
        span({ class: "completion-detail" }, item.detail)
    );
}

export function tooltipView(item: CompletionItem): ReadonlyArray<DomNode> {
    return [
        span({ class: "tooltip-title" }, item.label),
        span({ class: "tooltip-doc" }, item.doc)
    ];
}

const editor = styled(
    div(
        { id: "editor", class: "hidden" },
        div(
            { id: "editorBody" },
            div(
                { id: "editorScroll" },
                pre({ id: "editorHighlight" }),
                textarea({ id: "editorText" }),
                div(
                    { id: "editorPopup", class: "hidden" },
                    div(
                        { id: "editorPopupHint" },
                        span({ class: "cmp-key" }, "Up/Dn"),
                        "move",
                        span({ class: "cmp-key" }, "Enter/Tab"),
                        "accept",
                        span({ class: "cmp-key" }, "Esc"),
                        "dismiss"
                    ),
                    div({ id: "editorPopupList" })
                ),
                div({ id: "editorCompletionDoc", class: "hidden" }),
                div({ id: "editorTooltip", class: "hidden" })
            ),
            div({ id: "editorError" })
        ),
        div({ id: "editorGutter" })
    ),
    editorCss,
    ["active"]
);

export function editorView(): typeof editor.tree {
    return editor.tree;
}
