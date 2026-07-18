export enum NotationKind {
    Identifier = "identifier",
    Number = "number",
    Operator = "operator",
    Row = "row",
    Fenced = "fenced",
    Fraction = "fraction",
    Superscript = "superscript",
    Subscript = "subscript",
    Radical = "radical",
    LimitOperator = "limit-operator",
    Accent = "accent",
    Styled = "styled"
}

// A presentation style wrapping a subexpression, applied by a directive (`\mathbf`, `\textcolor`). The values are the
// MathML `mathvariant` vocabulary, so a renderer emits them as an attribute (or an OMML run property) without a map.
export enum MathVariant {
    Normal = "normal",
    Bold = "bold",
    Italic = "italic",
    BoldItalic = "bold-italic",
    DoubleStruck = "double-struck",
    Script = "script",
    Fraktur = "fraktur",
    SansSerif = "sans-serif",
    Monospace = "monospace"
}

// Every style facet a directive can set. `Variant`/`Color` wrap a subexpression as an `<mstyle>` attribute;
// `Placement` configures a big operator's own limit layout. Renderers switch on it to pick what they emit.
export enum StyleKind {
    Variant = "variant",
    Color = "color",
    Placement = "placement"
}

// Where a big operator's limits sit: beside the sign as scripts (∫_a^b) or stacked above and below it (∑ from i=1).
// Set when lowering -- integrals default beside, sums and lim-style operators stacked -- and `\limits`/`\nolimits`
// override that default.
export enum LimitPlacement {
    Stacked = "stacked",
    Beside = "beside"
}

// A mark set over its operand (`x̂`). The kind is semantic; each renderer maps it to its own accent glyph.
export enum AccentKind {
    Hat = "hat",
    Vec = "vec",
    Bar = "bar",
    Tilde = "tilde",
    Dot = "dot",
    Ddot = "ddot",
    Overline = "overline"
}
