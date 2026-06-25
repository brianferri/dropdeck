import { button, div, h2, span } from "#/dom";
import { declaration, rule } from "@dropdeck/html/css";
import type { DomNode } from "#/dom";

export function pickerView(names: ReadonlyArray<string>, decks: ReadonlyArray<DomNode>): DomNode {
    return div(
        { class: "picker-overlay" },
        div(
            { class: "picker" },
            h2({ class: "picker-title" }, "Choose a deck"),
            div(
                { class: "picker-body" },
                div({ class: "picker-list" }, names.map((name) => button({ class: "picker-card" }, name))),
                div(
                    { class: "picker-preview" },
                    div({ class: "picker-stage" }, decks),
                    div(
                        { class: "picker-controls" },
                        button({ class: "picker-arrow prev" }),
                        span({ class: "picker-counter" }),
                        button({ class: "picker-arrow next" })
                    ),
                    button({ class: "picker-present" }, "Present")
                )
            )
        )
    );
}

export const pickerCss = [
    // z-index 300 sits above the dropzone (200), which stays visible until a deck is presented.
    rule([".picker-overlay"], [
        declaration("position", "fixed"),
        declaration("inset", "0"),
        declaration("z-index", "300"),
        declaration("display", "flex"),
        declaration("align-items", "center"),
        declaration("justify-content", "center"),
        declaration("padding", "2rem"),
        declaration("background", "rgba(3, 7, 18, 0.72)"),
        declaration("backdrop-filter", "blur(0.375rem)")
    ]),
    rule([".picker"], [
        declaration("width", "100%"),
        declaration("max-width", "64rem"),
        declaration("padding", "1.6rem"),
        declaration("border-radius", "1.25rem"),
        declaration("background", "var(--color-bg, #0b1220)"),
        declaration("color", "var(--color-text, #e6edf3)"),
        declaration("border", "0.0625rem solid var(--surface-border, rgba(255, 255, 255, 0.14))"),
        declaration("box-shadow", "0 1.5rem 5rem rgba(0, 0, 0, 0.5)")
    ]),
    rule([".picker-title"], [
        declaration("margin", "0 0 1.2rem"),
        declaration("font-size", "1.3rem"),
        declaration("font-weight", "800")
    ]),
    rule([".picker-body"], [
        declaration("display", "flex"),
        declaration("gap", "1.4rem"),
        declaration("align-items", "flex-start")
    ]),
    rule([".picker-list"], [
        declaration("flex", "none"),
        declaration("width", "11rem"),
        declaration("max-height", "22rem"),
        declaration("overflow", "auto"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("gap", "0.5rem")
    ]),
    rule([".picker-card"], [
        declaration("padding", "0.7rem 0.9rem"),
        declaration("border-radius", "0.75rem"),
        declaration("border", "0.0625rem solid var(--surface-border, rgba(255, 255, 255, 0.14))"),
        declaration("background", "var(--surface, rgba(255, 255, 255, 0.06))"),
        declaration("color", "inherit"),
        declaration("font", "inherit"),
        declaration("font-weight", "600"),
        declaration("text-align", "left"),
        declaration("cursor", "pointer"),
        declaration("white-space", "nowrap"),
        declaration("overflow", "hidden"),
        declaration("text-overflow", "ellipsis")
    ]),
    rule([".picker-card.selected"], [
        declaration("border-color", "var(--color-accent-1, #5cd0b3)"),
        declaration("color", "var(--color-accent-1, #5cd0b3)")
    ]),
    rule([".picker-preview"], [
        declaration("flex", "1"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("align-items", "center"),
        declaration("gap", "0.8rem")
    ]),
    // Aspect must match the deck's fixed 1180 x 663.75 so the JS-set --preview-scale fits it without distortion.
    rule([".picker-stage"], [
        declaration("width", "min(58vw, 46rem)"),
        declaration("aspect-ratio", "1180 / 663.75"),
        declaration("overflow", "hidden"),
        declaration("border-radius", "0.75rem"),
        declaration("border", "0.0625rem solid var(--surface-border, rgba(255, 255, 255, 0.14))")
    ]),
    rule([".picker-deck"], [
        declaration("display", "none"),
        declaration("transform", "scale(var(--preview-scale, 0.6))"),
        declaration("transform-origin", "top left")
    ]),
    rule([".picker-deck.shown"], [declaration("display", "block")]),
    rule([".picker-controls"], [
        declaration("display", "flex"),
        declaration("align-items", "center"),
        declaration("gap", "1rem")
    ]),
    rule([".picker-arrow"], [
        declaration("width", "2rem"),
        declaration("height", "2rem"),
        declaration("border", "none"),
        declaration("border-radius", "2rem"),
        declaration("background", "var(--surface, rgba(255, 255, 255, 0.06))"),
        declaration("color", "inherit"),
        declaration("cursor", "pointer"),
        declaration("font-size", "1.1rem"),
        declaration("line-height", "1")
    ]),
    rule([".picker-arrow.prev::before"], [declaration("content", "\"\\2039\"")]),
    rule([".picker-arrow.next::before"], [declaration("content", "\"\\203a\"")]),
    rule([".picker-counter"], [
        declaration("min-width", "3.5rem"),
        declaration("text-align", "center"),
        declaration("font-size", "0.85rem"),
        declaration("color", "var(--color-text-muted, #7e8ca0)")
    ]),
    rule([".picker-present"], [
        declaration("padding", "0.65rem 1.6rem"),
        declaration("border", "none"),
        declaration("border-radius", "2rem"),
        declaration("background", "var(--color-accent-1, #0f766e)"),
        declaration("color", "#fff"),
        declaration("font-weight", "700"),
        declaration("cursor", "pointer")
    ])
] as const;
