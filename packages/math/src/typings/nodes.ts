import type { BinaryOperator, ExpressionKind, MathConstant } from "../Specification.js";

export type NumberNode<Value extends number = number> = {
    kind: ExpressionKind.Number,
    value: Value
};

export type VariableNode<Name extends string = string> = {
    kind: ExpressionKind.Variable,
    name: Name
};

export type ConstantNode<Name extends MathConstant = MathConstant> = {
    kind: ExpressionKind.Constant,
    name: Name
};

export type CallNode<
    Callee extends string = string,
    Children extends Content = Content
> = {
    kind: ExpressionKind.Call,
    callee: Callee,
    children: Children
};

export type NegateNode<Children extends Content = Content> = {
    kind: ExpressionKind.Negate,
    children: Children
};

export type NotNode<Children extends Content = Content> = {
    kind: ExpressionKind.Not,
    children: Children
};

export type BinaryNode<
    Operator extends BinaryOperator = BinaryOperator,
    Children extends Content = Content
> = {
    kind: ExpressionKind.Binary,
    operator: Operator,
    children: Children
};

export type Expression =
    | NumberNode
    | VariableNode
    | ConstantNode
    | CallNode
    | NegateNode
    | NotNode
    | BinaryNode;
export type Content = ReadonlyArray<Expression>;
export type One<Operand extends Expression> = readonly [Operand];
export type Pair<Left extends Expression, Right extends Expression> = readonly [Left, Right];
