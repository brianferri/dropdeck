import { declaration, rule } from "@dropdeck/html/css";

export const slideStyle = [
    rule([".slide"], [
        declaration("position", "absolute"),
        declaration("inset", "0"),
        declaration("background", "var(--color-bg)"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("align-items", "center"),
        declaration("justify-content", "center"),
        declaration("opacity", "0"),
        declaration("transform", "scale(0.97)"),
        declaration("transition", "opacity 0.55s ease, transform 0.55s ease"),
        declaration("pointer-events", "none"),
        declaration("overflow", "hidden")
    ]),
    rule([".slide.active"], [
        declaration("opacity", "1"),
        declaration("transform", "scale(1)"),
        declaration("pointer-events", "all")
    ]),
    rule([".slide > .content"], [
        declaration("position", "relative"),
        declaration("z-index", "2"),
        declaration("width", "100%"),
        declaration("max-width", "1180px"),
        declaration("padding", "clamp(1.4rem, 3vw, 3rem)"),
        declaration("max-height", "100%"),
        // The slide already clips at its bounds, so the column stays visible: a morph flying a shape past the
        // column edge must be cut only at the slide, not here, and a scaled title raises no scrollbar.
        declaration("overflow", "visible")
    ])
] as const;
