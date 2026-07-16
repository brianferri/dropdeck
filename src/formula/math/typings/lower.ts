import type { BinaryOperator, ExpressionKind, MathConstant, MathFunction, OPERATOR_PRECEDENCE } from "@dropdeck/math";
import type { Expression } from "@dropdeck/math";
import type { AccentKindOf } from "#/formula/accent";
import type { AccentFunction, CONSTANT_GLYPH, INTEGRAL_GLYPH, LIM_OPERATOR, NARY_GLYPH, OPERATOR_GLYPH } from "#/formula/math/glyphs";
import type { FirstMatch, LessOrEqual, LessThan } from "@dropdeck/common";
import type {
    AccentNode, FencedNode, FractionNode, IdentifierNode, NaryNode, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode, Triple
} from "#/formula/typings/nodes";

export type MathContent = ReadonlyArray<Expression>;
type Level<Op extends BinaryOperator> = (typeof OPERATOR_PRECEDENCE)[Op];

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

// `omega_0` tokenises as one variable name and splits into base + index below; the base or index may itself spell a
// constant (`omega`), which must show its glyph (ω_0, not the letters `omega_0`). Maps such a name to its glyph, else
// leaves it -- the type-level twin of `constantOr`.
type ConstantOr<Name extends string> = Name extends keyof typeof CONSTANT_GLYPH ? (typeof CONSTANT_GLYPH)[Name] : Name;

type SubscriptIndex<Index extends string> = Index extends `${infer Value extends number}` ? NumberNode<Value> : IdentifierNode<ConstantOr<Index>>;

// A `_` in a variable name is a semantic subscript in math but a presentational one here, split on the first `_`.
type LowerVariable<E extends Expression> =
    E extends { kind: ExpressionKind.Variable, name: infer Name extends string }
        ? Name extends `${infer Base}_${infer Index}` ? SubscriptNode<Pair<IdentifierNode<ConstantOr<Base>>, SubscriptIndex<Index>>> : IdentifierNode<Name>
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
    [Callee, Children] extends [`${MathFunction.Sqrt}`, readonly [infer Arg extends Expression]]
        ? RadicalNode<One<LowerMath<Arg>>> : false;

type RootLower<Callee extends string, Children extends MathContent> =
    [Callee, Children] extends [`${MathFunction.Root}`, readonly [infer Index extends Expression, infer Radicand extends Expression]]
        ? RadicalNode<Pair<LowerMath<Radicand>, LowerMath<Index>>> : false;

type FactLower<Callee extends string, Children extends MathContent> =
    [Callee, Children] extends [`${MathFunction.Fact}`, readonly [infer Arg extends Expression]]
        ? RowNode<readonly [LowerMath<Arg>, OperatorNode<"!">]> : false;

type NaryLower<Table extends object, Callee extends string, Under extends Notation, Over extends Notation, Body extends Notation> =
    Callee extends `${infer Key extends keyof Table & string}`
        ? NaryNode<Table[Key] & string, Triple<Under, Over, Body>>
        : false;

type SumLower<Callee extends string, Children extends MathContent> =
    Children extends readonly [infer Index extends Expression, infer Lower extends Expression, infer Upper extends Expression, infer Body extends Expression]
        ? NaryLower<typeof NARY_GLYPH, Callee, RowNode<readonly [LowerMath<Index>, OperatorNode<"=">, LowerMath<Lower>]>, LowerMath<Upper>, LowerMath<Body>>
        : false;

type IntegralLower<Callee extends string, Children extends MathContent> =
    Children extends readonly [infer Body extends Expression]
        ? NaryLower<typeof INTEGRAL_GLYPH, Callee, RowNode<readonly []>, RowNode<readonly []>, LowerMath<Body>>
        : Children extends readonly [infer Lower extends Expression, infer Upper extends Expression, infer Body extends Expression]
            ? NaryLower<typeof INTEGRAL_GLYPH, Callee, LowerMath<Lower>, LowerMath<Upper>, LowerMath<Body>>
            : false;

type LimLower<Callee extends string, Children extends MathContent> =
    Children extends readonly [infer Lower extends Expression, infer Body extends Expression]
        ? NaryLower<typeof LIM_OPERATOR, Callee, LowerMath<Lower>, RowNode<readonly []>, LowerMath<Body>>
        : false;

type AccentLower<Callee extends string, Children extends MathContent> =
    [Callee, Children] extends [AccentFunction, readonly [infer Base extends Expression]]
        ? AccentNode<AccentKindOf<Callee>, One<LowerMath<Base>>> : false;

type GenericCall<Callee extends string, Children extends MathContent> =
    RowNode<readonly [IdentifierNode<Callee>, FencedNode<"(", ")", One<LowerArgs<Children>>>]>;

type LowerCall<E extends Expression> =
    E extends { kind: ExpressionKind.Call, callee: infer Callee extends string, children: infer Children extends MathContent }
        ? FirstMatch<[
            SqrtLower<Callee, Children>,
            RootLower<Callee, Children>,
            FactLower<Callee, Children>,
            SumLower<Callee, Children>,
            IntegralLower<Callee, Children>,
            LimLower<Callee, Children>,
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
