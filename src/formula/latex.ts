import { NotationKind as LatexKind } from "@dropdeck/latex";
import {
    fenced, fraction, identifier, number, operator, radical, root, row, subscript, superscript
} from "#/formula/build";
import type { Content as LatexContent, Notation as LatexNotation } from "@dropdeck/latex";
import type {
    FencedNode, FractionNode, IdentifierNode, Notation, NumberNode, One, OperatorNode, Pair, RadicalNode, RowNode,
    SubscriptNode, SuperscriptNode
} from "#/formula/nodes";

enum LatexCommand {
    Cdot = "\\cdot",
    Times = "\\times",
    Div = "\\div",
    Pm = "\\pm",
    Mp = "\\mp",
    Le = "\\le",
    Leq = "\\leq",
    Ge = "\\ge",
    Geq = "\\geq",
    Ne = "\\ne",
    Neq = "\\neq",
    Approx = "\\approx",
    Equiv = "\\equiv",
    Land = "\\land",
    Lor = "\\lor",
    To = "\\to",
    Mapsto = "\\mapsto",
    In = "\\in",
    Cup = "\\cup",
    Cap = "\\cap",
    Alpha = "\\alpha",
    Beta = "\\beta",
    Gamma = "\\gamma",
    Delta = "\\delta",
    Theta = "\\theta",
    Lambda = "\\lambda",
    Mu = "\\mu",
    Pi = "\\pi",
    Sigma = "\\sigma",
    Phi = "\\phi",
    Omega = "\\omega",
    Tau = "\\tau"
}

type LatexGlyphTable = { [Command in keyof typeof LATEX_GLYPH as `${Command}`]: (typeof LATEX_GLYPH)[Command] };
type LatexGlyph<Symbol extends string> = Symbol extends keyof LatexGlyphTable ? LatexGlyphTable[Symbol] : Symbol;

type LowerLatexList<Children extends LatexContent> =
    Children extends readonly [infer Head extends LatexNotation, ...infer Rest extends LatexContent]
        ? readonly [LowerLatex<Head>, ...LowerLatexList<Rest>]
        : readonly [];

type IdentifierLatex<N extends LatexNotation> = N extends { kind: LatexKind.Identifier, symbol: infer Symbol extends string } ? IdentifierNode<LatexGlyph<Symbol>> : false;
type NumberLatex<N extends LatexNotation> = N extends { kind: LatexKind.Number, value: infer Value extends number } ? NumberNode<Value> : false;
type OperatorLatex<N extends LatexNotation> = N extends { kind: LatexKind.Operator, symbol: infer Symbol extends string } ? OperatorNode<LatexGlyph<Symbol>> : false;
type RowLatex<N extends LatexNotation> = N extends { kind: LatexKind.Row, children: infer Children extends LatexContent } ? RowNode<LowerLatexList<Children>> : false;
type FencedLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Fenced, open: infer Open extends string, close: infer Close extends string, children: infer Children extends LatexContent }
        ? FencedNode<Open, Close, LowerLatexList<Children>>
        : false;
type FractionLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Fraction, children: infer Children extends LatexContent }
        ? Children extends readonly [infer Numerator extends LatexNotation, infer Denominator extends LatexNotation] ? FractionNode<Pair<LowerLatex<Numerator>, LowerLatex<Denominator>>> : false
        : false;
type SuperscriptLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Superscript, children: infer Children extends LatexContent }
        ? Children extends readonly [infer Base extends LatexNotation, infer Exponent extends LatexNotation] ? SuperscriptNode<Pair<LowerLatex<Base>, LowerLatex<Exponent>>> : false
        : false;
type SubscriptLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Subscript, children: infer Children extends LatexContent }
        ? Children extends readonly [infer Base extends LatexNotation, infer Index extends LatexNotation] ? SubscriptNode<Pair<LowerLatex<Base>, LowerLatex<Index>>> : false
        : false;
type RadicalLatex<N extends LatexNotation> =
    N extends { kind: LatexKind.Radical, children: infer Children extends LatexContent }
        ? Children extends readonly [infer Radicand extends LatexNotation, infer Index extends LatexNotation] ? RadicalNode<Pair<LowerLatex<Radicand>, LowerLatex<Index>>>
            : Children extends readonly [infer Radicand extends LatexNotation] ? RadicalNode<One<LowerLatex<Radicand>>>
                : false
        : false;

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

export type LowerLatex<N extends LatexNotation> = Extract<FirstMatch<[
    IdentifierLatex<N>,
    NumberLatex<N>,
    OperatorLatex<N>,
    RowLatex<N>,
    FencedLatex<N>,
    FractionLatex<N>,
    SuperscriptLatex<N>,
    SubscriptLatex<N>,
    RadicalLatex<N>
]>, Notation>;

const LATEX_GLYPH = {
    [LatexCommand.Cdot]: "·",
    [LatexCommand.Times]: "×",
    [LatexCommand.Div]: "÷",
    [LatexCommand.Pm]: "±",
    [LatexCommand.Mp]: "∓",
    [LatexCommand.Le]: "≤",
    [LatexCommand.Leq]: "≤",
    [LatexCommand.Ge]: "≥",
    [LatexCommand.Geq]: "≥",
    [LatexCommand.Ne]: "≠",
    [LatexCommand.Neq]: "≠",
    [LatexCommand.Approx]: "≈",
    [LatexCommand.Equiv]: "≡",
    [LatexCommand.Land]: "∧",
    [LatexCommand.Lor]: "∨",
    [LatexCommand.To]: "→",
    [LatexCommand.Mapsto]: "↦",
    [LatexCommand.In]: "∈",
    [LatexCommand.Cup]: "∪",
    [LatexCommand.Cap]: "∩",
    [LatexCommand.Alpha]: "α",
    [LatexCommand.Beta]: "β",
    [LatexCommand.Gamma]: "γ",
    [LatexCommand.Delta]: "δ",
    [LatexCommand.Theta]: "θ",
    [LatexCommand.Lambda]: "λ",
    [LatexCommand.Mu]: "μ",
    [LatexCommand.Pi]: "π",
    [LatexCommand.Sigma]: "σ",
    [LatexCommand.Phi]: "φ",
    [LatexCommand.Omega]: "ω",
    [LatexCommand.Tau]: "τ"
} as const satisfies Record<LatexCommand, string>;

function isLatexGlyph(symbol: string): symbol is keyof typeof LATEX_GLYPH {
    return symbol in LATEX_GLYPH;
}

function latexGlyph(symbol: string): string {
    return isLatexGlyph(symbol) ? LATEX_GLYPH[symbol] : symbol;
}

function lowerLatexNode(node: LatexNotation): Notation {
    switch (node.kind) {
        case LatexKind.Identifier: return identifier(latexGlyph(node.symbol));
        case LatexKind.Number: return number(node.value);
        case LatexKind.Operator: return operator(latexGlyph(node.symbol));
        case LatexKind.Row: return row(node.children.map(lowerLatexNode));
        case LatexKind.Fenced: return fenced(node.open, node.close, node.children.map(lowerLatexNode));
        case LatexKind.Fraction: return fraction(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Superscript: return superscript(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Subscript: return subscript(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Radical:
            return node.children.length === 2
                ? root(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]))
                : radical(lowerLatexNode(node.children[0]));
    }
}

export function lowerLatex<const N extends LatexNotation>(node: N): LowerLatex<N> {
    return lowerLatexNode(node) as LowerLatex<N>;
}
