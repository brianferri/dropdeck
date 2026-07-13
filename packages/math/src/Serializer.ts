import { BinaryOperator, ExpressionKind, OPERATOR_PRECEDENCE, UnaryOperator } from "./Specification.js";
import type { BinaryNode, Expression } from "./typings/nodes.js";
import type { Precedence } from "./typings/operators.js";
import type { Serialize } from "./typings/serialize.js";

function binaryPrecedenceOf(expression: Expression): Precedence | null {
    return expression.kind === ExpressionKind.Binary ? OPERATOR_PRECEDENCE[expression.operator] : null;
}

function wrapUnaryOperand(operand: Expression): string {
    const text = serializeNode(operand);
    return binaryPrecedenceOf(operand) === null ? text : `(${text})`;
}

function wrapBinaryChild(child: Expression, parentPrecedence: Precedence, tight: boolean): string {
    const text = serializeNode(child);
    const childPrecedence = binaryPrecedenceOf(child);
    if (childPrecedence === null) return text;
    const wrap = tight ? childPrecedence <= parentPrecedence : childPrecedence < parentPrecedence;
    return wrap ? `(${text})` : text;
}

function serializeBinary(node: BinaryNode): string {
    const precedence = OPERATOR_PRECEDENCE[node.operator];
    const rightAssociative = node.operator === BinaryOperator.Power;
    const left = wrapBinaryChild(node.children[0], precedence, rightAssociative);
    const right = wrapBinaryChild(node.children[1], precedence, !rightAssociative);
    return `${left} ${node.operator} ${right}`;
}

function serializeNode(expression: Expression): string {
    switch (expression.kind) {
        case ExpressionKind.Number: return String(expression.value);
        case ExpressionKind.Variable: return expression.name;
        case ExpressionKind.Constant: return expression.name;
        case ExpressionKind.Call: return `${expression.callee}(${expression.children.map(serializeNode).join(", ")})`;
        case ExpressionKind.Negate: return `${BinaryOperator.Subtract}${wrapUnaryOperand(expression.children[0])}`;
        case ExpressionKind.Not: return `${UnaryOperator.Not} ${wrapUnaryOperand(expression.children[0])}`;
        case ExpressionKind.Binary: return serializeBinary(expression);
    }
}

export function serialize<const E extends Expression>(expression: E): Serialize<E> {
    return serializeNode(expression) as Serialize<E>;
}
