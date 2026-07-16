import type { Content as LatexContent, NotationKind as LatexKind, Notation as LatexNotation } from "@dropdeck/latex";
import type { LatexGlyph } from "#/formula/latex/glyphs";
import type { AccentKindOf } from "#/formula/accent";
import type { LimitOperatorGlyph } from "#/formula/nary";
import type { FirstMatch } from "@dropdeck/common";
import type {
    AccentNode, FencedNode, FractionNode, IdentifierNode, NaryNode, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode, Triple
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

type DetectSup<Base extends LatexNotation, Upper extends LatexNotation> =
    Base extends { kind: LatexKind.Subscript, children: readonly [infer Inner extends LatexNotation, infer Lower extends LatexNotation] }
        ? [LimitGlyphOf<Inner>] extends [never] ? false : readonly [LimitGlyphOf<Inner>, LowerLatex<Lower>, LowerLatex<Upper>]
        : [LimitGlyphOf<Base>] extends [never] ? false : readonly [LimitGlyphOf<Base>, EmptyRow, LowerLatex<Upper>];

type DetectSub<Base extends LatexNotation, Lower extends LatexNotation> =
    Base extends { kind: LatexKind.Superscript, children: readonly [infer Inner extends LatexNotation, infer Upper extends LatexNotation] }
        ? [LimitGlyphOf<Inner>] extends [never] ? false : readonly [LimitGlyphOf<Inner>, LowerLatex<Lower>, LowerLatex<Upper>]
        : [LimitGlyphOf<Base>] extends [never] ? false : readonly [LimitGlyphOf<Base>, LowerLatex<Lower>, EmptyRow];

// A limit operator scripted with `_`/`^` (in either order) collapses with the term after it into a `NaryNode`, the
// runtime `detectNary`/`lowerLatexRow` mirrored: `[symbol, lower, upper]` when the head is a scripted operator.
type DetectNary<Node extends LatexNotation> =
    Node extends { kind: LatexKind.Superscript, children: readonly [infer Base extends LatexNotation, infer Upper extends LatexNotation] }
        ? DetectSup<Base, Upper>
        : Node extends { kind: LatexKind.Subscript, children: readonly [infer Base extends LatexNotation, infer Lower extends LatexNotation] }
            ? DetectSub<Base, Lower>
            : false;

type LowerLatexRow<Children extends LatexContent> =
    Children extends readonly [infer Head extends LatexNotation, ...infer Rest extends LatexContent]
        ? DetectNary<Head> extends readonly [infer Symbol extends string, infer Lower extends Notation, infer Upper extends Notation]
            ? Rest extends readonly [infer Body extends LatexNotation, ...infer Tail extends LatexContent]
                ? readonly [NaryNode<Symbol, Triple<Lower, Upper, LowerLatex<Body>>>, ...LowerLatexRow<Tail>]
                : readonly [NaryNode<Symbol, Triple<Lower, Upper, EmptyRow>>]
            : readonly [LowerLatex<Head>, ...LowerLatexRow<Rest>]
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
