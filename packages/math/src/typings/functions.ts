import type { MathAccent, MathFunction } from "../Specification.js";
import type { Expression, One, Pair, VariableNode } from "./nodes.js";

export type MathCallee = MathFunction | MathAccent;

export type MathArguments = {
    [MathFunction.Sqrt]: One<Expression>,
    [MathFunction.Fact]: One<Expression>,
    [MathFunction.Sin]: One<Expression>,
    [MathFunction.Cos]: One<Expression>,
    [MathFunction.Tan]: One<Expression>,
    [MathFunction.Ln]: One<Expression>,
    [MathFunction.Exp]: One<Expression>,
    [MathFunction.Abs]: One<Expression>,
    [MathFunction.Log]: One<Expression> | Pair<Expression, Expression>,
    [MathFunction.Sum]: readonly [VariableNode, Expression, Expression, Expression],
    [MathFunction.Prod]: readonly [VariableNode, Expression, Expression, Expression],
    [MathFunction.Bigcup]: readonly [VariableNode, Expression, Expression, Expression],
    [MathFunction.Bigcap]: readonly [VariableNode, Expression, Expression, Expression],
    [MathAccent.Hat]: One<Expression>,
    [MathAccent.Vec]: One<Expression>,
    [MathAccent.Bar]: One<Expression>,
    [MathAccent.Tilde]: One<Expression>,
    [MathAccent.Dot]: One<Expression>,
    [MathAccent.Ddot]: One<Expression>,
    [MathAccent.Overline]: One<Expression>
};

export type MathArity<Callee extends MathCallee> = MathArguments[Callee]["length"];
