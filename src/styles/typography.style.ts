import { declaration, rule } from "@dropdeck/html/css";

export const typographyStyle = [
    rule([".cover-title"], [
        declaration("font-family", "var(--font-display)"),
        declaration("font-size", "clamp(2.1rem, 4.6vw, 3.8rem)"),
        declaration("line-height", "1.06"),
        declaration("color", "var(--color-text)"),
        declaration("letter-spacing", "-0.01em"),
        declaration("margin", "0")
    ]),
    rule([".section-title"], [
        declaration("font-family", "var(--font-display)"),
        declaration("font-size", "clamp(2rem, 4.4vw, 3.3rem)"),
        declaration("line-height", "1.08"),
        declaration("color", "var(--color-text)"),
        declaration("margin", "0")
    ]),
    // The accent underline is its own element, so the morph can capture it as a distinct
    // target and glide it straight from one title's position to the next -- a pseudo-element is laid out at the
    // arriving slide's edge from frame zero and would snap there. `inline-block` lets the column's text-align place
    // it (centred under a cover/section title, left under a content title) with no per-layout rule.
    rule([".title-rule"], [
        declaration("display", "inline-block"),
        declaration("width", "64px"),
        declaration("height", "4px"),
        declaration("border-radius", "2px"),
        declaration("background", "var(--color-accent-1)"),
        declaration("margin", "0.6rem 0 1.2rem")
    ]),
    rule([".slide-title"], [
        declaration("font-family", "var(--font-display)"),
        declaration("font-size", "clamp(1.7rem, 3.4vw, 2.5rem)"),
        declaration("line-height", "1.1"),
        declaration("color", "var(--color-text)"),
        declaration("margin", "0"),
        declaration("letter-spacing", "-0.01em")
    ]),
    rule([".eyebrow"], [
        declaration("text-transform", "uppercase"),
        declaration("letter-spacing", "0.24em"),
        declaration("color", "var(--color-text-muted)"),
        declaration("font-size", "0.92rem"),
        declaration("margin", "1.1rem 0 0")
    ]),
    rule([".cover-meta"], [
        declaration("color", "var(--color-text-secondary)"),
        declaration("font-size", "1.12rem"),
        declaration("margin", "0.5rem 0 0")
    ]),
    rule([".cover-sub"], [
        declaration("color", "var(--color-text-muted)"),
        declaration("font-size", "0.95rem"),
        declaration("margin", "0.4rem 0 0")
    ]),
    rule([".feature-emoji"], [
        declaration("font-family", "'Noto Color Emoji', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif"),
        declaration("font-size", "84px"),
        declaration("line-height", "1"),
        declaration("margin", "0 0 0.6rem"),
        declaration("text-align", "center"),
        declaration("animation", "float 3s ease-in-out infinite")
    ]),
    rule([".slide :where(h3)"], [
        declaration("font-family", "var(--font-body)"),
        declaration("font-weight", "800"),
        declaration("font-size", "1.35rem"),
        declaration("color", "var(--color-accent-1)"),
        declaration("margin", "0 0 0.55rem")
    ]),
    rule([".slide :where(h2):not(.slide-title):not(.section-title)"], [
        declaration("font-family", "var(--font-display)"),
        declaration("font-size", "1.7rem"),
        declaration("color", "var(--color-text)"),
        declaration("margin", "1rem 0 0.6rem")
    ]),
    rule([".slide :where(p)"], [
        declaration("line-height", "1.5"),
        declaration("color", "var(--color-text-secondary)"),
        declaration("margin", "0 0 0.6rem"),
        declaration("font-size", "1.05rem")
    ]),
    rule([".slide :where(ul, ol)"], [
        declaration("padding-left", "1.2em"),
        declaration("margin", "0.4em 0")
    ]),
    rule([".slide :where(ul)"], [declaration("list-style", "disc")]),
    rule([".slide :where(li)"], [
        declaration("margin-bottom", "0.4rem"),
        declaration("line-height", "1.45"),
        declaration("color", "var(--color-text-secondary)"),
        declaration("font-size", "1.05rem")
    ]),
    rule([".slide :where(strong)"], [
        declaration("color", "var(--color-accent-1)"),
        declaration("font-weight", "700")
    ]),
    rule([".slide :where(a)"], [declaration("color", "var(--color-accent-1)")]),
    rule([".slide :where(img)"], [
        declaration("max-width", "100%"),
        declaration("max-height", "360px"),
        declaration("border-radius", "12px"),
        declaration("display", "block"),
        declaration("margin", "0.6rem auto")
    ]),
    rule([".slide :where(hr)"], [
        declaration("border", "none"),
        declaration("border-top", "1px solid var(--surface-border)"),
        declaration("margin", "1rem 0")
    ]),
    rule([".section-block :where(p)"], [
        declaration("font-size", "1.3rem"),
        declaration("color", "var(--color-text-secondary)"),
        declaration("line-height", "1.4")
    ])
] as const;
