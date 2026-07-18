import type { ColorCommand, LatexCommandOf, VARIANT_COMMAND } from "#/formula/latex/glyphs";
import type { AccentKind, MathVariant } from "#/formula/nodes";
import type { FirstMatch } from "@dropdeck/common";
import type {
    AccentNode, AttributeStyle, ColorStyle, Content, FencedNode, FractionNode, IdentifierNode, LimitOperatorNode, Notation,
    NumberNode, One, OperatorNode, Pair, RadicalNode, RowNode, StyledNode, SubscriptNode, SuperscriptNode, Triple, VariantStyle
} from "#/formula/typings/nodes";

type JoinLatex<Children extends Content> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? Rest extends readonly [] ? ToLatex<Head> : `${ToLatex<Head>} ${JoinLatex<Rest>}`
        : "";

// A script or accent binds a single base, so a row is braced to keep the whole of it under the construct.
type LatexArg<N extends Notation> = N extends RowNode ? `{${ToLatex<N>}}` : ToLatex<N>;

type IdentifierLatexText<N extends Notation> = N extends IdentifierNode<infer Symbol extends string> ? LatexCommandOf<Symbol> : false;
type NumberLatexText<N extends Notation> = N extends NumberNode<infer Value extends number> ? `${Value}` : false;
type OperatorLatexText<N extends Notation> = N extends OperatorNode<infer Symbol extends string> ? LatexCommandOf<Symbol> : false;
type RowLatexText<N extends Notation> = N extends RowNode<infer Children extends Content> ? JoinLatex<Children> : false;
type FencedLatexText<N extends Notation> =
    N extends FencedNode<infer Open extends string, infer Close extends string, infer Children extends Content> ? `${Open}${JoinLatex<Children>}${Close}` : false;
type FractionLatexText<N extends Notation> =
    N extends FractionNode<Pair<infer Num extends Notation, infer Den extends Notation>>
        ? `\\frac{${ToLatex<Num>}}{${ToLatex<Den>}}` : false;
type SuperscriptLatexText<N extends Notation> =
    N extends SuperscriptNode<Pair<infer Base extends Notation, infer Exponent extends Notation>>
        ? `${LatexArg<Base>}^{${ToLatex<Exponent>}}` : false;
type SubscriptLatexText<N extends Notation> =
    N extends SubscriptNode<Pair<infer Base extends Notation, infer Index extends Notation>>
        ? `${LatexArg<Base>}_{${ToLatex<Index>}}` : false;
type RadicalLatexText<N extends Notation> =
    N extends RadicalNode<Pair<infer Radicand extends Notation, infer Index extends Notation>>
        ? `\\sqrt[${ToLatex<Index>}]{${ToLatex<Radicand>}}`
        : N extends RadicalNode<One<infer Radicand extends Notation>>
            ? `\\sqrt{${ToLatex<Radicand>}}` : false;
type LimitOperatorLatexText<N extends Notation> =
    N extends LimitOperatorNode<infer Symbol extends string, Triple<infer Lower extends Notation, infer Upper extends Notation, infer Body extends Notation>>
        ? `${LatexCommandOf<Symbol>}_{${ToLatex<Lower>}}^{${ToLatex<Upper>}} ${ToLatex<Body>}` : false;
type AccentLatexText<N extends Notation> =
    N extends AccentNode<infer Accent extends AccentKind, One<infer Base extends Notation>>
        ? `\\${Accent}{${ToLatex<Base>}}` : false;
type StyledLatexText<N extends Notation> =
    N extends StyledNode<infer S extends AttributeStyle, One<infer Child extends Notation>>
        ? S extends VariantStyle<infer Variant extends MathVariant> ? `${(typeof VARIANT_COMMAND)[Variant]}{${ToLatex<Child>}}`
            : S extends ColorStyle<infer Color extends string> ? `${ColorCommand.TextColor}{${Color}}{${ToLatex<Child>}}` : false
        : false;

export type ToLatex<N extends Notation> = Extract<FirstMatch<[
    IdentifierLatexText<N>,
    NumberLatexText<N>,
    OperatorLatexText<N>,
    RowLatexText<N>,
    FencedLatexText<N>,
    FractionLatexText<N>,
    SuperscriptLatexText<N>,
    SubscriptLatexText<N>,
    RadicalLatexText<N>,
    LimitOperatorLatexText<N>,
    AccentLatexText<N>,
    StyledLatexText<N>
]>, string>;
