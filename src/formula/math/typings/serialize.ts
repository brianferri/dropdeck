import type { ColorFunction, MathCalleeTable, MathConstantName, MathToken, VARIANT_CALLEE } from "#/formula/math/glyphs";
import type { AccentKind, MathVariant } from "#/formula/nodes";
import type { FirstMatch } from "@dropdeck/common";
import type {
    AccentNode, AttributeStyle, ColorStyle, Content, FencedNode, FractionNode, IdentifierNode, LimitOperatorNode,
    Notation, NumberNode, One, OperatorNode, Pair, RadicalNode, RowNode, StyledNode, SubscriptNode, SuperscriptNode, Triple, VariantStyle
} from "#/formula/typings/nodes";

type JoinMath<Children extends Content, Separator extends string> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? Rest extends readonly [] ? ToMath<Head> : `${ToMath<Head>}${Separator}${JoinMath<Rest, Separator>}`
        : "";

// A row binds looser than a fraction/power, so it is parenthesised there to survive the round trip.
type MathGroup<N extends Notation> = N extends RowNode ? `(${ToMath<N>})` : ToMath<N>;

type NumberMath<N extends Notation> = N extends NumberNode<infer Value extends number> ? `${Value}` : false;
type IdentifierMath<N extends Notation> = N extends IdentifierNode<infer Symbol extends string> ? MathConstantName<Symbol> : false;
type OperatorMath<N extends Notation> = N extends OperatorNode<infer Symbol extends string> ? MathToken<Symbol> : false;
type RowMath<N extends Notation> = N extends RowNode<infer Children extends Content> ? JoinMath<Children, " "> : false;
type FencedMath<N extends Notation> =
    N extends FencedNode<infer Open extends string, infer Close extends string, infer Children extends Content> ? `${Open}${JoinMath<Children, " ">}${Close}` : false;
type FractionMath<N extends Notation> =
    N extends FractionNode<Pair<infer Num extends Notation, infer Den extends Notation>>
        ? `${MathGroup<Num>} / ${MathGroup<Den>}` : false;
type SuperscriptMath<N extends Notation> =
    N extends SuperscriptNode<Pair<infer Base extends Notation, infer Exponent extends Notation>>
        ? `${MathGroup<Base>}^${MathGroup<Exponent>}` : false;
type SubscriptMath<N extends Notation> =
    N extends SubscriptNode<Pair<infer Base extends Notation, infer Index extends Notation>>
        ? `${ToMath<Base>}_${ToMath<Index>}` : false;
type RadicalMath<N extends Notation> =
    N extends RadicalNode<readonly [infer Radicand extends Notation, ...Content]>
        ? `sqrt(${ToMath<Radicand>})` : false;
// `sum(i, 1, n, body)` recovers its index and start from the `i = 1` lower row the lowering built.
type LimitOperatorMath<N extends Notation> =
    N extends LimitOperatorNode<
        infer Symbol extends string,
        Triple<RowNode<Triple<infer Index extends Notation, OperatorNode, infer Start extends Notation>>, infer Upper extends Notation, infer Body extends Notation>
    >
        ? Symbol extends keyof MathCalleeTable
            ? `${MathCalleeTable[Symbol]}(${ToMath<Index>}, ${ToMath<Start>}, ${ToMath<Upper>}, ${ToMath<Body>})` : false
        : false;
type AccentMath<N extends Notation> =
    N extends AccentNode<infer Accent extends AccentKind, One<infer Base extends Notation>>
        ? `${Accent}(${ToMath<Base>})` : false;
type StyledMath<N extends Notation> =
    N extends StyledNode<infer S extends AttributeStyle, One<infer Child extends Notation>>
        ? S extends VariantStyle<infer Variant extends MathVariant> ? `${(typeof VARIANT_CALLEE)[Variant]}(${ToMath<Child>})`
            : S extends ColorStyle<infer Color extends string> ? `${ColorFunction.Color}(${Color}, ${ToMath<Child>})` : false
        : false;

export type ToMath<N extends Notation> = Extract<FirstMatch<[
    NumberMath<N>,
    IdentifierMath<N>,
    OperatorMath<N>,
    RowMath<N>,
    FencedMath<N>,
    FractionMath<N>,
    SuperscriptMath<N>,
    SubscriptMath<N>,
    RadicalMath<N>,
    LimitOperatorMath<N>,
    AccentMath<N>,
    StyledMath<N>
]>, string>;
