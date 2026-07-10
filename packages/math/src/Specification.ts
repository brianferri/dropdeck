export enum ExpressionKind {
    Number = "number",
    Variable = "variable",
    Constant = "constant",
    Call = "call",
    Negate = "negate",
    Not = "logical-not",
    Binary = "binary"
}

export enum BinaryOperator {
    Add = "+",
    Subtract = "-",
    Multiply = "*",
    Divide = "/",
    Power = "^",
    LessThan = "<",
    GreaterThan = ">",
    LessOrEqual = "<=",
    GreaterOrEqual = ">=",
    Equal = "==",
    NotEqual = "!=",
    And = "and",
    Or = "or"
}

export enum UnaryOperator {
    Not = "not"
}

export enum MathConstant {
    Pi = "pi",
    E = "e",
    Tau = "tau"
}

export type ComparisonOperator =
    | BinaryOperator.LessThan
    | BinaryOperator.GreaterThan
    | BinaryOperator.LessOrEqual
    | BinaryOperator.GreaterOrEqual
    | BinaryOperator.Equal
    | BinaryOperator.NotEqual;
export type AdditiveOperator = BinaryOperator.Add | BinaryOperator.Subtract;
export type MultiplicativeOperator = BinaryOperator.Multiply | BinaryOperator.Divide;

export const OPERATOR_PRECEDENCE = {
    [BinaryOperator.Or]: 1,
    [BinaryOperator.And]: 2,
    [BinaryOperator.LessThan]: 3,
    [BinaryOperator.GreaterThan]: 3,
    [BinaryOperator.LessOrEqual]: 3,
    [BinaryOperator.GreaterOrEqual]: 3,
    [BinaryOperator.Equal]: 3,
    [BinaryOperator.NotEqual]: 3,
    [BinaryOperator.Add]: 4,
    [BinaryOperator.Subtract]: 4,
    [BinaryOperator.Multiply]: 5,
    [BinaryOperator.Divide]: 5,
    [BinaryOperator.Power]: 6
} as const satisfies Record<BinaryOperator, number>;

export type Precedence = (typeof OPERATOR_PRECEDENCE)[BinaryOperator];

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
