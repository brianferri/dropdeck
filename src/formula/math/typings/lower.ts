import type { BinaryOperator, ExpressionKind, MathConstant, MathFunction, OPERATOR_PRECEDENCE } from "@dropdeck/math";
import type { Expression } from "@dropdeck/math";
import type { AccentKindOf } from "#/formula/accent";
import type { AccentFunction, CONSTANT_GLYPH, NaryFunction, NaryGlyphTable, OPERATOR_GLYPH } from "#/formula/math/glyphs";
import type { FirstMatch } from "@dropdeck/common";
import type {
    AccentNode, FencedNode, FractionNode, IdentifierNode, NaryNode, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode, Triple
} from "#/formula/typings/nodes";

export type MathContent = ReadonlyArray<Expression>;
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

type LowerConstant<E extends Expression> = E extends { kind: ExpressionKind.Constant, name: infer Name extends MathConstant } ? IdentifierNode<(typeof CONSTANT_GLYPH)[Name]> : false;

type LowerUnary<E extends Expression, Symbol extends string> =
    E extends { children: readonly [infer Operand extends Expression] } ? RowNode<readonly [OperatorNode<Symbol>, WrapTight<Operand>]> : false;
type LowerNegate<E extends Expression> = E extends { kind: ExpressionKind.Negate } ? LowerUnary<E, "-"> : false;
type LowerNot<E extends Expression> = E extends { kind: ExpressionKind.Not } ? LowerUnary<E, "¬"> : false;

type LowerArgList<Children extends MathContent> =
    Children extends readonly [infer Head extends Expression, ...infer Tail extends MathContent]
        ? Tail extends readonly [] ? readonly [LowerMath<Head>] : readonly [LowerMath<Head>, OperatorNode<",">, ...LowerArgList<Tail>]
        : readonly [];
type LowerArgs<Children extends MathContent> = Children extends readonly [infer Only extends Expression] ? LowerMath<Only> : RowNode<LowerArgList<Children>>;

type SqrtLower<Callee extends string, Children extends MathContent> =
    Callee extends `${MathFunction.Sqrt}` ? Children extends readonly [infer Arg extends Expression] ? RadicalNode<One<LowerMath<Arg>>> : false : false;
// `fact(n)` renders as the postfix `n!`.
type FactLower<Callee extends string, Children extends MathContent> =
    Callee extends `${MathFunction.Fact}` ? Children extends readonly [infer Arg extends Expression] ? RowNode<readonly [LowerMath<Arg>, OperatorNode<"!">]> : false : false;
// `sum(i, lo, up, body)` joins the index and its start into the `i = lo` under-limit.
type NaryLower<Callee extends string, Children extends MathContent> =
    Callee extends infer Function extends NaryFunction
        ? Children extends readonly [infer Index extends Expression, infer Lower extends Expression, infer Upper extends Expression, infer Body extends Expression]
            ? NaryNode<NaryGlyphTable[Function], Triple<RowNode<readonly [LowerMath<Index>, OperatorNode<"=">, LowerMath<Lower>]>, LowerMath<Upper>, LowerMath<Body>>>
            : false
        : false;
type AccentLower<Callee extends string, Children extends MathContent> =
    Callee extends AccentFunction ? Children extends readonly [infer Base extends Expression] ? AccentNode<AccentKindOf<Callee>, One<LowerMath<Base>>> : false : false;
type GenericCall<Callee extends string, Children extends MathContent> = RowNode<readonly [IdentifierNode<Callee>, FencedNode<"(", ")", One<LowerArgs<Children>>>]>;
type LowerCall<E extends Expression> =
    E extends { kind: ExpressionKind.Call, callee: infer Callee extends string, children: infer Children extends MathContent }
        ? FirstMatch<[
            SqrtLower<Callee, Children>,
            FactLower<Callee, Children>,
            NaryLower<Callee, Children>,
            AccentLower<Callee, Children>,
            GenericCall<Callee, Children>
        ]>
        : false;

type LowerBinary<E extends Expression> =
    E extends { kind: ExpressionKind.Binary, operator: infer Op extends BinaryOperator, children: readonly [infer Left extends Expression, infer Right extends Expression] }
        ? Op extends BinaryOperator.Divide ? FractionNode<Pair<LowerMath<Left>, LowerMath<Right>>>
            : Op extends BinaryOperator.Power ? SuperscriptNode<Pair<WrapTight<Left>, LowerMath<Right>>>
                : RowNode<readonly [WrapChild<Left, Level<Op>, false>, OperatorNode<(typeof OPERATOR_GLYPH)[Op]>, WrapChild<Right, Level<Op>, true>]>
        : false;

export type LowerMath<E extends Expression> = Extract<FirstMatch<[
    LowerNumber<E>,
    LowerVariable<E>,
    LowerConstant<E>,
    LowerNegate<E>,
    LowerNot<E>,
    LowerCall<E>,
    LowerBinary<E>
]>, Notation>;
