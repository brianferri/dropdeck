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

export enum MathFunction {
    Sqrt = "sqrt",
    Fact = "fact",
    Sin = "sin",
    Cos = "cos",
    Tan = "tan",
    Ln = "ln",
    Exp = "exp",
    Abs = "abs",
    Log = "log",
    Sum = "sum",
    Prod = "prod",
    Bigcup = "bigcup",
    Bigcap = "bigcap"
}

export enum MathAccent {
    Hat = "hat",
    Vec = "vec",
    Bar = "bar",
    Tilde = "tilde",
    Dot = "dot",
    Ddot = "ddot",
    Overline = "overline"
}

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
