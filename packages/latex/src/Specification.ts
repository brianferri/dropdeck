export enum NotationKind {
    Identifier = "identifier",
    Number = "number",
    Operator = "operator",
    Row = "row",
    Fenced = "fenced",
    Fraction = "fraction",
    Superscript = "superscript",
    Subscript = "subscript",
    Radical = "radical"
}

export enum OperatorChar {
    Plus = "+",
    Minus = "-",
    Equal = "=",
    Less = "<",
    Greater = ">",
    Slash = "/"
}

// A command not listed here falls through to an identifier glyph (`\alpha`) or function name (`\sin`).
export enum LatexOperatorCommand {
    Cdot = "cdot",
    Times = "times",
    Div = "div",
    Pm = "pm",
    Mp = "mp",
    Le = "le",
    Ge = "ge",
    Ne = "ne",
    Leq = "leq",
    Geq = "geq",
    Neq = "neq",
    Approx = "approx",
    Equiv = "equiv",
    Land = "land",
    Lor = "lor",
    To = "to",
    Mapsto = "mapsto",
    In = "in",
    Cup = "cup",
    Cap = "cap"
}

export type IdentifierNode<Symbol extends string = string> = {
    kind: NotationKind.Identifier,
    symbol: Symbol
};

export type NumberNode<Value extends number = number> = {
    kind: NotationKind.Number,
    value: Value
};

export type OperatorNode<Symbol extends string = string> = {
    kind: NotationKind.Operator,
    symbol: Symbol
};

export type RowNode<Children extends Content = Content> = {
    kind: NotationKind.Row,
    children: Children
};

export type FencedNode<
    Open extends string = string,
    Close extends string = string,
    Children extends Content = Content
> = {
    kind: NotationKind.Fenced,
    open: Open,
    close: Close,
    children: Children
};

export type FractionNode<Children extends Content = Content> = {
    kind: NotationKind.Fraction,
    children: Children
};

export type SuperscriptNode<Children extends Content = Content> = {
    kind: NotationKind.Superscript,
    children: Children
};

export type SubscriptNode<Children extends Content = Content> = {
    kind: NotationKind.Subscript,
    children: Children
};

export type RadicalNode<Children extends Content = Content> = {
    kind: NotationKind.Radical,
    children: Children
};

export type Notation =
    | IdentifierNode
    | NumberNode
    | OperatorNode
    | RowNode
    | FencedNode
    | FractionNode
    | SuperscriptNode
    | SubscriptNode
    | RadicalNode;

export type Content = ReadonlyArray<Notation>;
export type One<Operand extends Notation> = readonly [Operand];
export type Pair<Left extends Notation, Right extends Notation> = readonly [Left, Right];
