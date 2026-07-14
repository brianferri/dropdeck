import type { FirstMatch, LessOrEqual, LessThan, Negate } from "@dropdeck/common";
import type { BinaryOperator, OPERATOR_PRECEDENCE, UnaryOperator } from "../Specification.js";
import type {
    BinaryNode, CallNode, Content, ConstantNode, Expression, NegateNode, NotNode, NumberNode, VariableNode
} from "./nodes.js";

type Level<Op extends BinaryOperator> = (typeof OPERATOR_PRECEDENCE)[Op];

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

type NumberText<E extends Expression> = E extends NumberNode<infer Value> ? `${Value}` : false;
type VariableText<E extends Expression> = E extends VariableNode<infer Name> ? Name : false;
type ConstantText<E extends Expression> = E extends ConstantNode<infer Name> ? Name : false;
type CallText<E extends Expression> = E extends CallNode<infer Callee, infer Children extends Content> ? `${Callee}(${SerializeArgs<Children>})` : false;

// A unary node applied to its single operand; `Prefix` carries the operator and its separator (`-` or `not `).
type UnaryText<E extends Expression, Node, Prefix extends string> =
    & E extends Node
    & { children: readonly [infer Operand extends Expression] }
        ? `${Prefix}${WrapUnaryOperand<Operand>}`
        : false;
type NegateText<E extends Expression> = UnaryText<E, NegateNode, `${BinaryOperator.Subtract}`>;
type NotText<E extends Expression> = UnaryText<E, NotNode, `${UnaryOperator.Not} `>;

type BinaryText<E extends Expression> =
    E extends BinaryNode<infer Op extends BinaryOperator, readonly [infer Left extends Expression, infer Right extends Expression]>
        ? SerializeBinary<Op, Left, Right>
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
