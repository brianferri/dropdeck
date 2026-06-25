import { declaration, rule } from "@dropdeck/html/css";

export const blocksStyle = [
    rule([".panel"], [
        declaration("background", "var(--surface)"),
        declaration("border", "1px solid var(--surface-border)"),
        declaration("border-radius", "20px"),
        declaration("box-shadow", "0 14px 36px rgba(15, 23, 42, 0.08)"),
        declaration("padding", "1.4rem 1.5rem")
    ]),
    rule([".panel :where(p):last-child", ".panel :where(ul):last-child", ".panel :where(ol):last-child"], [declaration("margin-bottom", "0")]),
    rule([".metric"], [
        declaration("background", "linear-gradient(180deg, rgba(var(--accent2-rgb), 0.12), var(--surface))"),
        declaration("border", "1px solid rgba(var(--accent1-rgb), 0.18)"),
        declaration("border-radius", "18px"),
        declaration("box-shadow", "0 14px 36px rgba(var(--accent1-rgb), 0.07)"),
        declaration("padding", "1.3rem 1.4rem")
    ]),
    rule([".metric .m-label"], [
        declaration("font-size", "0.78rem"),
        declaration("text-transform", "uppercase"),
        declaration("letter-spacing", "0.08em"),
        declaration("color", "var(--color-text-muted)"),
        declaration("font-weight", "700")
    ]),
    rule([".metric .m-value"], [
        declaration("font-size", "2.1rem"),
        declaration("font-weight", "800"),
        declaration("color", "var(--color-accent-1)"),
        declaration("margin-top", "0.25rem"),
        declaration("line-height", "1.1")
    ]),
    rule([".metric .m-sub"], [
        declaration("margin-top", "0.4rem"),
        declaration("color", "var(--color-text-secondary)"),
        declaration("font-size", "0.95rem"),
        declaration("line-height", "1.35")
    ]),
    rule([".slide :where(blockquote)"], [
        declaration("background", "linear-gradient(180deg, rgba(var(--accent2-rgb), 0.12), var(--surface))"),
        declaration("border", "1px solid rgba(var(--accent1-rgb), 0.2)"),
        declaration("border-left", "4px solid var(--color-accent-1)"),
        declaration("border-radius", "16px"),
        declaration("padding", "1.1rem 1.3rem"),
        declaration("margin", "0.9rem 0")
    ]),
    rule([".slide :where(blockquote) :where(p)"], [
        declaration("margin", "0 0 0.5rem"),
        declaration("color", "var(--color-text-secondary)"),
        declaration("font-size", "1.1rem")
    ]),
    rule([".slide :where(blockquote) :where(p):last-child"], [declaration("margin-bottom", "0")]),
    rule([".code-block"], [
        declaration("background", "var(--surface)"),
        declaration("border", "1px solid var(--surface-border)"),
        declaration("border-radius", "14px"),
        declaration("padding", "1rem 1.2rem"),
        declaration("overflow", "auto")
    ]),
    rule([".code-block pre"], [declaration("margin", "0")]),
    rule([".code-block code", ".slide :where(code)"], [
        declaration("font-family", "var(--font-mono)"),
        declaration("font-size", "0.95rem"),
        declaration("color", "var(--color-text)"),
        declaration("font-variant-ligatures", "none"),
        declaration("font-feature-settings", "\"liga\" 0, \"calt\" 0")
    ]),
    rule([".slide :where(:not(pre) > code)"], [
        declaration("background", "rgba(var(--accent1-rgb), 0.1)"),
        declaration("color", "var(--color-accent-1)"),
        declaration("padding", "0.1em 0.35em"),
        declaration("border-radius", "5px")
    ]),
    rule([".bar-row"], [declaration("margin-bottom", "1rem")]),
    rule([".bar-row:last-child"], [declaration("margin-bottom", "0")]),
    rule([".bar-head"], [
        declaration("display", "flex"),
        declaration("justify-content", "space-between"),
        declaration("margin-bottom", "0.35rem")
    ]),
    rule([".bar-head .lab"], [
        declaration("font-weight", "700"),
        declaration("color", "var(--color-text)")
    ]),
    rule([".bar-head .tag"], [declaration("color", "var(--color-text-muted)")]),
    rule([".bar-track"], [
        declaration("width", "100%"),
        declaration("height", "18px"),
        declaration("border-radius", "999px"),
        declaration("background", "var(--track)"),
        declaration("overflow", "hidden")
    ]),
    rule([".bar-fill"], [
        declaration("height", "100%"),
        declaration("border-radius", "999px"),
        declaration("background", "linear-gradient(90deg, var(--color-accent-1), var(--color-accent-2))"),
        declaration("width", "0")
    ]),
    rule(["table"], [
        declaration("border-collapse", "separate"),
        declaration("border-spacing", "8px"),
        declaration("width", "100%")
    ]),
    rule(["th"], [
        declaration("text-align", "left"),
        declaration("text-transform", "uppercase"),
        declaration("letter-spacing", "0.06em"),
        declaration("font-size", "0.8rem"),
        declaration("color", "var(--color-text-muted)"),
        declaration("padding", "0.2rem 0.9rem"),
        declaration("font-weight", "700")
    ]),
    rule(["td"], [
        declaration("background", "var(--surface)"),
        declaration("border", "1px solid var(--surface-border)"),
        declaration("border-radius", "12px"),
        declaration("padding", "0.7rem 0.9rem"),
        declaration("color", "var(--color-text-secondary)"),
        declaration("font-size", "1rem"),
        declaration("vertical-align", "top")
    ]),
    rule(["td:first-child"], [
        declaration("font-weight", "700"),
        declaration("color", "var(--color-text)")
    ])
] as const;
