import { cssVar, declaration, rule } from "@dropdeck/html/css";

// Each accent contributes these three rules at cycle offset `at`; defining them here keeps the selector shape in
// one place, so the accent entries in `chartStyle` below only vary the offset and the colour.
const cycleRule = {
    background: <const At extends string, const Accent extends string>(at: At, accent: Accent) => rule([
        `.chart .chart-bar:nth-child(${at})`,
        `.chart .chart-seg:nth-child(${at})`,
        `.chart .chart-key:nth-child(${at}) .chart-swatch`
    ], [declaration("background", accent)]),
    stroke: <const At extends string, const Accent extends string>(at: At, accent: Accent) => rule(
        [`.chart .chart-svg .chart-series:nth-child(${at}) .chart-stroke`],
        [declaration("stroke", accent)]
    ),
    fill: <const At extends string, const Accent extends string>(at: At, accent: Accent) => rule([
        `.chart .chart-svg .chart-series:nth-child(${at}) .chart-fill`,
        `.chart .chart-pie .chart-slice:nth-child(${at})`
    ], [declaration("fill", accent)])
};

export const chartStyle = [
    rule([".chart .chart-frame"], [
        declaration("display", "grid"),
        declaration("grid-template-columns", "auto 1fr"),
        declaration("column-gap", "0.6rem")
    ]),
    rule([".chart .chart-axis"], [
        declaration("grid-column", "1"),
        declaration("grid-row", "1"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("justify-content", "space-between"),
        declaration("align-items", "flex-end"),
        declaration("font-size", "0.72rem"),
        declaration("color", "var(--color-text-muted)")
    ]),
    // The repeating gradient lays a 1px gridline every quarter of the plot so bar heights read against a scale.
    rule([".chart .chart-plot"], [
        declaration("grid-column", "2"),
        declaration("grid-row", "1"),
        declaration("height", "240px"),
        declaration("display", "flex"),
        declaration("align-items", "flex-end"),
        declaration("gap", "1.1rem"),
        declaration("border-bottom", "1px solid var(--surface-border)"),
        declaration("background", "repeating-linear-gradient(to top, var(--surface-border) 0 1px, transparent 1px 25%)")
    ]),
    rule([".chart .chart-col"], [
        declaration("flex", "1"),
        declaration("height", "100%"),
        declaration("display", "flex"),
        declaration("align-items", "flex-end"),
        declaration("justify-content", "center"),
        declaration("gap", "0.4rem")
    ]),
    rule([".chart .chart-bar"], [
        declaration("width", "100%"),
        declaration("max-width", "46px"),
        declaration("min-height", "2px"),
        declaration("border-radius", "8px 8px 0 0"),
        declaration("box-shadow", "0 6px 16px rgba(var(--accent1-rgb), 0.18)")
    ]),
    rule([".chart .chart-stack"], [
        declaration("flex-direction", "column-reverse"),
        declaration("justify-content", "flex-start"),
        declaration("align-items", "center"),
        declaration("gap", "0")
    ]),
    rule([".chart .chart-seg"], [
        declaration("width", "100%"),
        declaration("max-width", "46px")
    ]),
    rule([".chart .chart-seg-cap"], [declaration("border-radius", "8px 8px 0 0")]),
    rule([".chart .chart-svg"], [
        declaration("width", "100%"),
        declaration("height", "100%"),
        declaration("display", "block")
    ]),
    rule([".chart .chart-stroke"], [
        declaration("fill", "none"),
        declaration("stroke-width", "2.5"),
        declaration("vector-effect", "non-scaling-stroke")
    ]),
    rule([".chart .chart-fill"], [
        declaration("stroke", "none"),
        declaration("fill-opacity", "0.16")
    ]),
    rule([".chart-pie-panel .chart-pie-wrap"], [
        declaration("display", "flex"),
        declaration("justify-content", "center")
    ]),
    rule([".chart .chart-pie"], [
        declaration("width", "260px"),
        declaration("max-width", "100%"),
        declaration("height", "240px")
    ]),
    rule([".chart .chart-slice"], [
        declaration("stroke", "var(--surface)"),
        declaration("stroke-width", "1")
    ]),
    rule([".chart .chart-xaxis"], [
        declaration("grid-column", "2"),
        declaration("grid-row", "2"),
        declaration("display", "flex"),
        declaration("gap", "1.1rem"),
        declaration("margin-top", "0.5rem")
    ]),
    rule([".chart .chart-xlabel"], [
        declaration("flex", "1"),
        declaration("text-align", "center"),
        declaration("font-size", "0.85rem"),
        declaration("color", "var(--color-text-secondary)")
    ]),
    rule([".chart .chart-legend"], [
        declaration("display", "flex"),
        declaration("justify-content", "center"),
        declaration("gap", "1.2rem"),
        declaration("margin-top", "0.9rem")
    ]),
    rule([".chart .chart-key"], [
        declaration("display", "flex"),
        declaration("align-items", "center"),
        declaration("gap", "0.4rem"),
        declaration("font-size", "0.85rem"),
        declaration("color", "var(--color-text-secondary)")
    ]),
    rule([".chart .chart-swatch"], [
        declaration("width", "12px"),
        declaration("height", "12px"),
        declaration("border-radius", "3px")
    ]),
    cycleRule.background("3n+1", cssVar("--color-accent-1")),
    cycleRule.stroke("3n+1", cssVar("--color-accent-1")),
    cycleRule.fill("3n+1", cssVar("--color-accent-1")),
    cycleRule.background("3n+2", cssVar("--color-accent-2")),
    cycleRule.stroke("3n+2", cssVar("--color-accent-2")),
    cycleRule.fill("3n+2", cssVar("--color-accent-2")),
    cycleRule.background("3n+3", cssVar("--color-accent-3")),
    cycleRule.stroke("3n+3", cssVar("--color-accent-3")),
    cycleRule.fill("3n+3", cssVar("--color-accent-3"))
] as const;
