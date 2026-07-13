import type { BinaryOperator, OPERATOR_PRECEDENCE } from "../Specification.js";

export type ComparisonOperator =
    | BinaryOperator.LessThan
    | BinaryOperator.GreaterThan
    | BinaryOperator.LessOrEqual
    | BinaryOperator.GreaterOrEqual
    | BinaryOperator.Equal
    | BinaryOperator.NotEqual;
export type AdditiveOperator = BinaryOperator.Add | BinaryOperator.Subtract;
export type MultiplicativeOperator = BinaryOperator.Multiply | BinaryOperator.Divide;

export type Precedence = (typeof OPERATOR_PRECEDENCE)[BinaryOperator];
