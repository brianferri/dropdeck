import { ExpressionKind } from "./Specification.js";
import type {
    BinaryNode, BinaryOperator, CallNode, Content, ConstantNode, Expression, MathConstant, NegateNode, NotNode,
    NumberNode, One, Pair, VariableNode
} from "./Specification.js";

export function number<const Value extends number>(value: Value): NumberNode<Value> {
    return { kind: ExpressionKind.Number, value };
}

export function variable<const Name extends string>(name: Name): VariableNode<Name> {
    return { kind: ExpressionKind.Variable, name };
}

export function constant<const Name extends MathConstant>(name: Name): ConstantNode<Name> {
    return { kind: ExpressionKind.Constant, name };
}

export function call<const Callee extends string, const Children extends Content>(callee: Callee, children: Children): CallNode<Callee, Children> {
    return { kind: ExpressionKind.Call, callee, children };
}

export function negate<const Operand extends Expression>(operand: Operand): NegateNode<One<Operand>> {
    return { kind: ExpressionKind.Negate, children: [operand] as const };
}

export function logicalNot<const Operand extends Expression>(operand: Operand): NotNode<One<Operand>> {
    return { kind: ExpressionKind.Not, children: [operand] as const };
}

export function binary<
    const Operator extends BinaryOperator,
    const Left extends Expression,
    const Right extends Expression
>(operator: Operator, left: Left, right: Right): BinaryNode<Operator, Pair<Left, Right>> {
    return { kind: ExpressionKind.Binary, operator, children: [left, right] as const };
}
