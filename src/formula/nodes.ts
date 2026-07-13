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
    Nary = "nary",
    Accent = "accent"
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
