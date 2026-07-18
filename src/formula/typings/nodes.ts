import type { AccentKind, LimitPlacement, MathVariant, NotationKind, StyleKind } from "../nodes.js";

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

export type LimitOperatorNode<
    Symbol extends string = string,
    Children extends Content = Content,
    Placement extends LimitPlacement = LimitPlacement
> = {
    kind: NotationKind.LimitOperator,
    symbol: Symbol,
    style: PlacementStyle<Placement>,
    children: Children
};

export type AccentNode<
    Accent extends AccentKind = AccentKind,
    Children extends Content = Content
> = {
    kind: NotationKind.Accent,
    accent: Accent,
    children: Children
};

export type VariantStyle<Variant extends MathVariant = MathVariant> = { kind: StyleKind.Variant, variant: Variant };
export type ColorStyle<Color extends string = string> = { kind: StyleKind.Color, color: Color };
export type PlacementStyle<Placement extends LimitPlacement = LimitPlacement> = { kind: StyleKind.Placement, placement: Placement };

// The two ways a style attaches: an attribute style wraps a subexpression in a `StyledNode`; a placement style
// configures a big operator's own layout in place. `Style` is the umbrella over every facet.
export type AttributeStyle = VariantStyle | ColorStyle;
export type Style = AttributeStyle | PlacementStyle;

export type StyledNode<
    S extends AttributeStyle = AttributeStyle,
    Children extends Content = Content
> = {
    kind: NotationKind.Styled,
    style: S,
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
    | RadicalNode
    | LimitOperatorNode
    | AccentNode
    | StyledNode;

export type Content = ReadonlyArray<Notation>;
export type One<Operand extends Notation> = readonly [Operand];
export type Pair<Left extends Notation, Right extends Notation> = readonly [Left, Right];
export type Triple<A extends Notation, B extends Notation, C extends Notation> = readonly [A, B, C];
