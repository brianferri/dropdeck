import { BinaryOperator, ExpressionKind, OPERATOR_PRECEDENCE, UnaryOperator } from "./Specification.js";
import type {
    BinaryNode, CallNode, Content, ConstantNode, Expression, NegateNode, NotNode, NumberNode, Precedence, VariableNode
} from "./Specification.js";

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

type Level<Op extends BinaryOperator> = {
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
}[Op];

type Units<N extends number, Acc extends ReadonlyArray<unknown> = []> =
    Acc["length"] extends N ? Acc : Units<N, [...Acc, unknown]>;
type LessOrEqual<A extends number, B extends number> = Units<B> extends [...Units<A>, ...ReadonlyArray<unknown>] ? true : false;
type LessThan<A extends number, B extends number> = Units<B> extends [...Units<A>, unknown, ...ReadonlyArray<unknown>] ? true : false;

type Negate<Flag extends boolean> = Flag extends true ? false : true;
type IsRightAssociative<Op extends BinaryOperator> = Op extends BinaryOperator.Power ? true : false;
type ParenthesisesEqual<Tight extends boolean, ChildLevel extends number, ParentLevel extends number> =
    Tight extends true ? LessOrEqual<ChildLevel, ParentLevel> : LessThan<ChildLevel, ParentLevel>;

type SerializeArgs<Args extends Content> =
    Args extends readonly [infer Head extends Expression, ...infer Rest extends Content]
        ? Rest extends readonly [] ? Serialize<Head> : `${Serialize<Head>}, ${SerializeArgs<Rest>}`
        : "";

type WrapUnaryOperand<Operand extends Expression> =
    Operand extends BinaryNode ? `(${Serialize<Operand>})` : Serialize<Operand>;

type WrapChild<Child extends Expression, ParentLevel extends number, Tight extends boolean> =
    Child extends { operator: infer ChildOp extends BinaryOperator }
        ? ParenthesisesEqual<Tight, Level<ChildOp>, ParentLevel> extends true ? `(${Serialize<Child>})` : Serialize<Child>
        : Serialize<Child>;

type SerializeBinary<Op extends BinaryOperator, Left extends Expression, Right extends Expression> =
    `${WrapChild<Left, Level<Op>, IsRightAssociative<Op>>} ${Op} ${WrapChild<Right, Level<Op>, Negate<IsRightAssociative<Op>>>}`;

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

type NumberText<E extends Expression> = E extends NumberNode<infer Value> ? `${Value}` : false;
type VariableText<E extends Expression> = E extends VariableNode<infer Name> ? Name : false;
type ConstantText<E extends Expression> = E extends ConstantNode<infer Name> ? Name : false;
type CallText<E extends Expression> = E extends CallNode<infer Callee, infer Children extends Content> ? `${Callee}(${SerializeArgs<Children>})` : false;

type NegateText<E extends Expression> =
    E extends NegateNode<infer Children extends Content>
        ? Children extends readonly [infer Operand extends Expression]
            ? `${BinaryOperator.Subtract}${WrapUnaryOperand<Operand>}`
            : false
        : false;

type NotText<E extends Expression> =
    E extends NotNode<infer Children extends Content>
        ? Children extends readonly [infer Operand extends Expression]
            ? `${UnaryOperator.Not} ${WrapUnaryOperand<Operand>}`
            : false
        : false;

type BinaryText<E extends Expression> =
    E extends BinaryNode<infer Op extends BinaryOperator, infer Children extends Content>
        ? Children extends readonly [infer Left extends Expression, infer Right extends Expression]
            ? SerializeBinary<Op, Left, Right>
            : false
        : false;

export type Serialize<E extends Expression> = FirstMatch<[
    NumberText<E>,
    VariableText<E>,
    ConstantText<E>,
    CallText<E>,
    NegateText<E>,
    NotText<E>,
    BinaryText<E>
]>;
