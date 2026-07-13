import type { NotationKind } from "../Specification.js";

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

export type AccentNode<Command extends string = string, Children extends Content = Content> = {
    kind: NotationKind.Accent,
    command: Command,
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
    | AccentNode;

export type Content = ReadonlyArray<Notation>;
export type One<Operand extends Notation> = readonly [Operand];
export type Pair<Left extends Notation, Right extends Notation> = readonly [Left, Right];
