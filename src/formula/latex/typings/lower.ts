import type { Content as LatexContent, NotationKind as LatexKind, Notation as LatexNotation } from "@dropdeck/latex";
import type { ColorCommand, LIMITS_PLACEMENT, LatexGlyph, VARIANT } from "#/formula/latex/glyphs";
import type { AccentKindOf } from "#/formula/accent";
import type { IntegralGlyph, LimitOperatorGlyph } from "#/formula/limit_operator";
import type { LimitPlacement } from "#/formula/nodes";
import type { FirstMatch, Lookup } from "@dropdeck/common";
import type {
    AccentNode, AttributeStyle, ColorStyle, FencedNode, FractionNode, IdentifierNode, LimitOperatorNode, Notation,
    NumberNode, One, OperatorNode, Pair, RadicalNode, RowNode, StyledNode, SubscriptNode, SuperscriptNode, Triple, VariantStyle
} from "#/formula/typings/nodes";

type LowerLatexList<Children extends LatexContent> =
    Children extends readonly [infer Head extends LatexNotation, ...infer Rest extends LatexContent]
        ? readonly [LowerLatex<Head>, ...LowerLatexList<Rest>]
        : readonly [];

type IdentifierLatex<N extends LatexNotation> = N extends { kind: LatexKind.Identifier, symbol: infer Symbol extends string } ? IdentifierNode<LatexGlyph<Symbol>> : false;
type NumberLatex<N extends LatexNotation> = N extends { kind: LatexKind.Number, value: infer Value extends number } ? NumberNode<Value> : false;
type OperatorLatex<N extends LatexNotation> = N extends { kind: LatexKind.Operator, symbol: infer Symbol extends string } ? OperatorNode<LatexGlyph<Symbol>> : false;
type EmptyRow = RowNode<readonly []>;

type LimitGlyphOf<Node extends LatexNotation> =
    Node extends { kind: LatexKind.Operator | LatexKind.Identifier, symbol: infer Symbol extends string }
        ? LatexGlyph<Symbol> extends infer Glyph extends LimitOperatorGlyph ? Glyph : never
        : never;

type DefaultPlacement<Glyph extends string> = Glyph extends IntegralGlyph ? LimitPlacement.Beside : LimitPlacement.Stacked;

// The innermost base and lowered `_`/`^` limits of a scripted node (in either order); `false` when it is not scripted.
type ScriptPartsOf<Node extends LatexNotation> =
    Node extends { kind: LatexKind.Superscript, children: readonly [infer Base extends LatexNotation, infer Upper extends LatexNotation] }
        ? Base extends { kind: LatexKind.Subscript, children: readonly [infer Inner extends LatexNotation, infer Lower extends LatexNotation] }
            ? readonly [Inner, LowerLatex<Lower>, LowerLatex<Upper>]
            : readonly [Base, EmptyRow, LowerLatex<Upper>]
        : Node extends { kind: LatexKind.Subscript, children: readonly [infer Base extends LatexNotation, infer Lower extends LatexNotation] }
            ? Base extends { kind: LatexKind.Superscript, children: readonly [infer Inner extends LatexNotation, infer Upper extends LatexNotation] }
                ? readonly [Inner, LowerLatex<Lower>, LowerLatex<Upper>]
                : readonly [Base, LowerLatex<Lower>, EmptyRow]
            : false;

// A recognized limit-operator glyph with its placement and lowered limits, or `false` when either is absent.
type LimitSpec<Glyph extends string, Placement extends LimitPlacement, Lower extends Notation, Upper extends Notation> =
    [Glyph] extends [never] ? false : [Placement] extends [never] ? false : readonly [Glyph, Placement, Lower, Upper];
type DefaultLimitSpec<Glyph extends string, Lower extends Notation, Upper extends Notation> =
    LimitSpec<Glyph, DefaultPlacement<Glyph>, Lower, Upper>;

// A scripted limit operator (`\int_a^b`); the placement follows the glyph's default.
type DetectLimitOperator<Node extends LatexNotation> =
    ScriptPartsOf<Node> extends readonly [infer Base extends LatexNotation, infer Lower extends Notation, infer Upper extends Notation]
        ? DefaultLimitSpec<LimitGlyphOf<Base>, Lower, Upper>
        : false;

// The symbol of an identifier command (`\mathbf`, `\limits`), or `never` for anything else -- the key a directive
// table is looked up by.
type IdentifierSymbol<Node extends LatexNotation> =
    Node extends { kind: LatexKind.Identifier, symbol: infer Symbol extends string } ? Symbol : never;

type LimitsPlacementOf<Base extends LatexNotation> = Lookup<IdentifierSymbol<Base>, typeof LIMITS_PLACEMENT>;
type VariantOf<Node extends LatexNotation> = Lookup<IdentifierSymbol<Node>, typeof VARIANT>;

type IsColorCommand<Node extends LatexNotation> =
    Node extends { kind: LatexKind.Identifier, symbol: infer Symbol extends string } ? Symbol extends `${ColorCommand}` ? true : false : false;

// `\textcolor{red}{x}` parses its color group as separate letter identifiers, so rejoin their symbols into the name.
type JoinIdentifiers<Children extends LatexContent> =
    Children extends readonly [infer Head extends LatexNotation, ...infer Rest extends LatexContent]
        ? Head extends { kind: LatexKind.Identifier, symbol: infer Symbol extends string } ? `${Symbol}${JoinIdentifiers<Rest>}` : never
        : "";
type ColorNameOf<Node extends LatexNotation> =
    Node extends { kind: LatexKind.Identifier, symbol: infer Symbol extends string } ? Symbol
        : Node extends { kind: LatexKind.Row, children: infer Children extends LatexContent } ? JoinIdentifiers<Children> : never;

// The parser folds a trailing script onto a directive's group; peel it back so the style wraps only the base.
type StyleContent<S extends AttributeStyle, Node extends LatexNotation> =
    Node extends { kind: LatexKind.Superscript, children: readonly [infer Base extends LatexNotation, infer Exp extends LatexNotation] }
        ? SuperscriptNode<Pair<StyleContent<S, Base>, LowerLatex<Exp>>>
        : Node extends { kind: LatexKind.Subscript, children: readonly [infer Base extends LatexNotation, infer Index extends LatexNotation] }
            ? SubscriptNode<Pair<StyleContent<S, Base>, LowerLatex<Index>>>
            : StyledNode<S, One<LowerLatex<Node>>>;

// `\int\limits_a^b`: a bare operator head, then a `\limits`/`\nolimits` carrying the limits, overriding the placement.
type OverrideLimitOperator<Head extends LatexNotation, Next extends LatexNotation> =
    ScriptPartsOf<Next> extends readonly [infer Base extends LatexNotation, infer Lower extends Notation, infer Upper extends Notation]
        ? LimitSpec<LimitGlyphOf<Head>, LimitsPlacementOf<Base>, Lower, Upper>
        : false;

type DefaultRow<Head extends LatexNotation, Rest extends LatexContent> =
    DetectLimitOperator<Head> extends readonly [infer Symbol extends string, infer Placement extends LimitPlacement, infer Lower extends Notation, infer Upper extends Notation]
        ? Rest extends readonly [infer Body extends LatexNotation, ...infer Tail extends LatexContent]
            ? readonly [LimitOperatorNode<Symbol, Triple<Lower, Upper, LowerLatex<Body>>, Placement>, ...LowerLatexRow<Tail>]
            : readonly [LimitOperatorNode<Symbol, Triple<Lower, Upper, EmptyRow>, Placement>]
        : readonly [LowerLatex<Head>, ...LowerLatexRow<Rest>];

type LowerLatexRow<Children extends LatexContent> =
    Children extends readonly [infer Head extends LatexNotation, infer Group extends LatexNotation, infer Content extends LatexNotation, ...infer Tail extends LatexContent]
        ? IsColorCommand<Head> extends true
            ? readonly [StyleContent<ColorStyle<ColorNameOf<Group>>, Content>, ...LowerLatexRow<Tail>]
            : StyleLimitRow<Children>
        : StyleLimitRow<Children>;

type StyleLimitRow<Children extends LatexContent> =
    Children extends readonly [infer Head extends LatexNotation, infer Next extends LatexNotation, ...infer After extends LatexContent]
        ? [VariantOf<Head>] extends [never]
            ? OverrideLimitOperator<Head, Next> extends readonly [infer Symbol extends string, infer Placement extends LimitPlacement, infer Lower extends Notation, infer Upper extends Notation]
                ? After extends readonly [infer Body extends LatexNotation, ...infer Tail extends LatexContent]
                    ? readonly [LimitOperatorNode<Symbol, Triple<Lower, Upper, LowerLatex<Body>>, Placement>, ...LowerLatexRow<Tail>]
                    : readonly [LimitOperatorNode<Symbol, Triple<Lower, Upper, EmptyRow>, Placement>]
                : DefaultRow<Head, readonly [Next, ...After]>
            : readonly [StyleContent<VariantStyle<VariantOf<Head>>, Next>, ...LowerLatexRow<After>]
        : Children extends readonly [infer Head extends LatexNotation, ...infer Rest extends LatexContent]
            ? DefaultRow<Head, Rest>
            : readonly [];

type RowLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Row, children: infer Children extends LatexContent }
        ? LowerLatexRow<Children> extends readonly [infer Only extends Notation] ? Only : RowNode<LowerLatexRow<Children>>
        : false;
type FencedLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Fenced, open: infer Open extends string, close: infer Close extends string, children: infer Children extends LatexContent }
        ? FencedNode<Open, Close, LowerLatexList<Children>>
        : false;
type FractionLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Fraction, children: readonly [infer Numerator extends LatexNotation, infer Denominator extends LatexNotation] }
        ? FractionNode<Pair<LowerLatex<Numerator>, LowerLatex<Denominator>>> : false;
type SuperscriptLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Superscript, children: readonly [infer Base extends LatexNotation, infer Exponent extends LatexNotation] }
        ? SuperscriptNode<Pair<LowerLatex<Base>, LowerLatex<Exponent>>> : false;
type SubscriptLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Subscript, children: readonly [infer Base extends LatexNotation, infer Index extends LatexNotation] }
        ? SubscriptNode<Pair<LowerLatex<Base>, LowerLatex<Index>>> : false;
type RadicalLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Radical, children: readonly [infer Radicand extends LatexNotation, infer Index extends LatexNotation] }
        ? RadicalNode<Pair<LowerLatex<Radicand>, LowerLatex<Index>>>
        : N extends { kind: LatexKind.Radical, children: readonly [infer Radicand extends LatexNotation] }
            ? RadicalNode<One<LowerLatex<Radicand>>> : false;
type AccentLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Accent, command: infer Command extends string, children: readonly [infer Base extends LatexNotation] }
        ? AccentNode<AccentKindOf<Command>, One<LowerLatex<Base>>> : false;

export type LowerLatex<N extends LatexNotation> = Extract<FirstMatch<[
    IdentifierLatex<N>,
    NumberLatex<N>,
    OperatorLatex<N>,
    RowLatex<N>,
    FencedLatex<N>,
    FractionLatex<N>,
    SuperscriptLatex<N>,
    SubscriptLatex<N>,
    RadicalLatex<N>,
    AccentLatex<N>
]>, Notation>;
