import { BinaryOperator, ExpressionKind, MathConstant, OPERATOR_PRECEDENCE } from "@dropdeck/math";
import { fenced, fraction, identifier, number, operator, radical, row, subscript, superscript } from "#/formula/build";
import type { BinaryNode, Expression } from "@dropdeck/math";
import type {
    FencedNode, FractionNode, IdentifierNode, Notation, NumberNode, One, OperatorNode, Pair, RadicalNode, RowNode,
    SubscriptNode, SuperscriptNode
} from "#/formula/nodes";

type OperatorGlyph = {
    [BinaryOperator.Add]: "+",
    [BinaryOperator.Subtract]: "-",
    [BinaryOperator.Multiply]: "·",
    [BinaryOperator.Divide]: "/",
    [BinaryOperator.Power]: "^",
    [BinaryOperator.LessThan]: "<",
    [BinaryOperator.GreaterThan]: ">",
    [BinaryOperator.LessOrEqual]: "≤",
    [BinaryOperator.GreaterOrEqual]: "≥",
    [BinaryOperator.Equal]: "=",
    [BinaryOperator.NotEqual]: "≠",
    [BinaryOperator.And]: "∧",
    [BinaryOperator.Or]: "∨"
};

type ConstantGlyph = {
    [MathConstant.Pi]: "π",
    [MathConstant.E]: "e",
    [MathConstant.Tau]: "τ"
};

type MathContent = ReadonlyArray<Expression>;
type Level<Op extends BinaryOperator> = (typeof OPERATOR_PRECEDENCE)[Op];

type Units<N extends number, Acc extends ReadonlyArray<unknown> = []> = Acc["length"] extends N ? Acc : Units<N, [...Acc, unknown]>;
type LessOrEqual<A extends number, B extends number> = Units<B> extends [...Units<A>, ...ReadonlyArray<unknown>] ? true : false;
type LessThan<A extends number, B extends number> = Units<B> extends [...Units<A>, unknown, ...ReadonlyArray<unknown>] ? true : false;

// `Divide`/`Power` become a fraction/superscript (self-grouping), so a child carrying one never needs a fence.
type RowOperator<Child extends Expression> =
    Child extends { kind: ExpressionKind.Binary, operator: infer Op extends BinaryOperator }
        ? Op extends BinaryOperator.Divide | BinaryOperator.Power ? never : Op
        : never;

type Fence<Child extends Expression> = FencedNode<"(", ")", One<LowerMath<Child>>>;

// A row child fences when its operator binds looser than the parent's -- looser-or-equal on the associativity side.
type WrapChild<Child extends Expression, ParentLevel extends number, Tight extends boolean> =
    [RowOperator<Child>] extends [never]
        ? LowerMath<Child>
        : RowOperator<Child> extends infer Op extends BinaryOperator
            ? (Tight extends true ? LessOrEqual<Level<Op>, ParentLevel> : LessThan<Level<Op>, ParentLevel>) extends true ? Fence<Child> : LowerMath<Child>
            : never;

type WrapTight<Child extends Expression> = [RowOperator<Child>] extends [never] ? LowerMath<Child> : Fence<Child>;

type LowerNumber<E extends Expression> = E extends { kind: ExpressionKind.Number, value: infer Value extends number } ? NumberNode<Value> : false;

type SubscriptIndex<Index extends string> = Index extends `${infer Value extends number}` ? NumberNode<Value> : IdentifierNode<Index>;

// A `_` in a variable name is a semantic subscript in math but a presentational one here, split on the first `_`.
type LowerVariable<E extends Expression> =
    E extends { kind: ExpressionKind.Variable, name: infer Name extends string }
        ? Name extends `${infer Base}_${infer Index}` ? SubscriptNode<Pair<IdentifierNode<Base>, SubscriptIndex<Index>>> : IdentifierNode<Name>
        : false;

type LowerConstant<E extends Expression> = E extends { kind: ExpressionKind.Constant, name: infer Name extends MathConstant } ? IdentifierNode<ConstantGlyph[Name]> : false;

type LowerUnary<E extends Expression, Symbol extends string> =
    E extends { children: infer Children extends MathContent } ? Children extends readonly [infer Operand extends Expression] ? RowNode<readonly [OperatorNode<Symbol>, WrapTight<Operand>]> : false : false;
type LowerNegate<E extends Expression> = E extends { kind: ExpressionKind.Negate } ? LowerUnary<E, "-"> : false;
type LowerNot<E extends Expression> = E extends { kind: ExpressionKind.Not } ? LowerUnary<E, "¬"> : false;

type LowerArgList<Children extends MathContent> =
    Children extends readonly [infer Head extends Expression, ...infer Tail extends MathContent]
        ? Tail extends readonly [] ? readonly [LowerMath<Head>] : readonly [LowerMath<Head>, OperatorNode<",">, ...LowerArgList<Tail>]
        : readonly [];
type LowerArgs<Children extends MathContent> = Children extends readonly [infer Only extends Expression] ? LowerMath<Only> : RowNode<LowerArgList<Children>>;

type LowerCall<E extends Expression> =
    E extends { kind: ExpressionKind.Call, callee: infer Callee extends string, children: infer Children extends MathContent }
        ? Callee extends "sqrt"
            ? Children extends readonly [infer Arg extends Expression] ? RadicalNode<One<LowerMath<Arg>>> : GenericCall<Callee, Children>
            : GenericCall<Callee, Children>
        : false;
type GenericCall<Callee extends string, Children extends MathContent> = RowNode<readonly [IdentifierNode<Callee>, FencedNode<"(", ")", One<LowerArgs<Children>>>]>;

type LowerBinary<E extends Expression> =
    E extends { kind: ExpressionKind.Binary, operator: infer Op extends BinaryOperator, children: infer Children extends MathContent }
        ? Children extends readonly [infer Left extends Expression, infer Right extends Expression]
            ? Op extends BinaryOperator.Divide ? FractionNode<Pair<LowerMath<Left>, LowerMath<Right>>>
                : Op extends BinaryOperator.Power ? SuperscriptNode<Pair<WrapTight<Left>, LowerMath<Right>>>
                    : RowNode<readonly [WrapChild<Left, Level<Op>, false>, OperatorNode<OperatorGlyph[Op]>, WrapChild<Right, Level<Op>, true>]>
            : false
        : false;

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

export type LowerMath<E extends Expression> = Extract<FirstMatch<[
    LowerNumber<E>,
    LowerVariable<E>,
    LowerConstant<E>,
    LowerNegate<E>,
    LowerNot<E>,
    LowerCall<E>,
    LowerBinary<E>
]>, Notation>;

const OPERATOR_GLYPH = {
    [BinaryOperator.Add]: "+",
    [BinaryOperator.Subtract]: "-",
    [BinaryOperator.Multiply]: "·",
    [BinaryOperator.Divide]: "/",
    [BinaryOperator.Power]: "^",
    [BinaryOperator.LessThan]: "<",
    [BinaryOperator.GreaterThan]: ">",
    [BinaryOperator.LessOrEqual]: "≤",
    [BinaryOperator.GreaterOrEqual]: "≥",
    [BinaryOperator.Equal]: "=",
    [BinaryOperator.NotEqual]: "≠",
    [BinaryOperator.And]: "∧",
    [BinaryOperator.Or]: "∨"
} as const satisfies Record<BinaryOperator, string>;

const CONSTANT_GLYPH = {
    [MathConstant.Pi]: "π",
    [MathConstant.E]: "e",
    [MathConstant.Tau]: "τ"
} as const satisfies Record<MathConstant, string>;

function isRowBinary(expression: Expression): expression is BinaryNode {
    if (expression.kind !== ExpressionKind.Binary) return false;
    if (expression.operator === BinaryOperator.Divide) return false;
    return expression.operator !== BinaryOperator.Power;
}

function wrapChild(child: Expression, parentLevel: number, tight: boolean): Notation {
    if (!isRowBinary(child)) return lowerNode(child);
    const childLevel = OPERATOR_PRECEDENCE[child.operator];
    const fence = tight ? childLevel <= parentLevel : childLevel < parentLevel;
    return fence ? fenced("(", ")", [lowerNode(child)]) : lowerNode(child);
}

function wrapTight(child: Expression): Notation {
    return isRowBinary(child) ? fenced("(", ")", [lowerNode(child)]) : lowerNode(child);
}

function subscriptIndex(index: string): Notation {
    if (index === "") return identifier(index);
    const value = Number(index);
    return Number.isNaN(value) ? identifier(index) : number(value);
}

function splitVariable(name: string): Notation {
    const underscore = name.indexOf("_");
    if (underscore === -1) return identifier(name);
    return subscript(identifier(name.slice(0, underscore)), subscriptIndex(name.slice(underscore + 1)));
}

function lowerArgs(children: MathContent): Notation {
    if (children.length === 1) return lowerNode(children[0]);
    const items: Array<Notation> = [];
    children.forEach((child, index) => {
        if (index > 0) items.push(operator(","));
        items.push(lowerNode(child));
    });
    return row(items);
}

function lowerCall(expression: Expression & { kind: ExpressionKind.Call }): Notation {
    if (expression.callee === "sqrt" && expression.children.length === 1) return radical(lowerNode(expression.children[0]));
    return row([identifier(expression.callee), fenced("(", ")", [lowerArgs(expression.children)])]);
}

function lowerBinary(expression: BinaryNode): Notation {
    const [left, right] = expression.children;
    if (expression.operator === BinaryOperator.Divide) return fraction(lowerNode(left), lowerNode(right));
    if (expression.operator === BinaryOperator.Power) return superscript(wrapTight(left), lowerNode(right));
    const parentLevel = OPERATOR_PRECEDENCE[expression.operator];
    return row([wrapChild(left, parentLevel, false), operator(OPERATOR_GLYPH[expression.operator]), wrapChild(right, parentLevel, true)]);
}

function lowerNode(expression: Expression): Notation {
    switch (expression.kind) {
        case ExpressionKind.Number: return number(expression.value);
        case ExpressionKind.Variable: return splitVariable(expression.name);
        case ExpressionKind.Constant: return identifier(CONSTANT_GLYPH[expression.name]);
        case ExpressionKind.Negate: return row([operator("-"), wrapTight(expression.children[0])]);
        case ExpressionKind.Not: return row([operator("¬"), wrapTight(expression.children[0])]);
        case ExpressionKind.Call: return lowerCall(expression);
        case ExpressionKind.Binary: return lowerBinary(expression);
    }
}

export function lowerMath<const E extends Expression>(expression: E): LowerMath<E> {
    return lowerNode(expression) as LowerMath<E>;
}
