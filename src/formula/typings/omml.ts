import type { Acc, Frac, Func, LimLow, Nary, OMath, Root, Run, SSub, SSup, Sqrt } from "@dropdeck/xml/omml";
import type { Content as XmlContent } from "@dropdeck/xml";
import type { NaryGlyph, NaryIntegralGlyph } from "#/formula/nary";
import type { FirstMatch } from "@dropdeck/common";
import type { AccentKind, NotationKind } from "#/formula/nodes";
import type {
    AccentNode, Content, FencedNode, IdentifierNode, NaryNode, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, Triple
} from "#/formula/typings/nodes";
import type { ACCENT_OMML } from "../omml.js";

// OMML has no grouping element, so a row -- and a fence, whose delimiters are just text runs like MathML's `<mo>` --
// flattens its nodes into the enclosing slot. Every rule therefore yields a list that the parent splices in.
type OmmlList<Children extends Content> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? readonly [...OmmlOf<Head>, ...OmmlList<Rest>]
        : readonly [];

// Identifier, number, and operator each render as a single text run of their glyph.
type IdentifierOmml<N extends Notation> = N extends IdentifierNode<infer Symbol extends string> ? readonly [Run<Symbol>] : false;
type NumberOmml<N extends Notation> = N extends NumberNode<infer Value extends number> ? readonly [Run<`${Value}`>] : false;
type OperatorOmml<N extends Notation> = N extends OperatorNode<infer Symbol extends string> ? readonly [Run<Symbol>] : false;
type RowOmml<N extends Notation> = N extends RowNode<infer Children extends Content> ? OmmlList<Children> : false;
type FencedOmml<N extends Notation> =
    N extends FencedNode<infer Open extends string, infer Close extends string, infer Children extends Content>
        ? readonly [Run<Open>, ...OmmlList<Children>, Run<Close>] : false;
// Fraction, superscript, and subscript are each a two-child wrap; the node kind selects which OMML element.
type OmmlBinary<Left extends XmlContent, Right extends XmlContent> = {
    [NotationKind.Fraction]: Frac<Left, Right>,
    [NotationKind.Superscript]: SSup<Left, Right>,
    [NotationKind.Subscript]: SSub<Left, Right>
};
type BinaryOmml<N extends Notation> =
    N extends { kind: infer K extends keyof OmmlBinary<never, never>, children: Pair<infer Left extends Notation, infer Right extends Notation> }
        ? readonly [OmmlBinary<OmmlOf<Left>, OmmlOf<Right>>[K]] : false;
type RadicalOmml<N extends Notation> =
    N extends RadicalNode<Pair<infer Radicand extends Notation, infer Index extends Notation>>
        ? readonly [Root<OmmlOf<Index>, OmmlOf<Radicand>>]
        : N extends RadicalNode<One<infer Radicand extends Notation>>
            ? readonly [Sqrt<OmmlOf<Radicand>>] : false;
// Integrals carry their limits beside the sign (`subSup`); sums and the other big operators stack them (`undOvr`).
type NaryLimLoc<Symbol extends string> = Symbol extends NaryIntegralGlyph ? "subSup" : "undOvr";
type NaryOmml<N extends Notation> =
    N extends NaryNode<infer Symbol extends string, Triple<infer Lower extends Notation, infer Upper extends Notation, infer Body extends Notation>>
        ? Symbol extends NaryGlyph
            ? readonly [Nary<Symbol, NaryLimLoc<Symbol>, OmmlOf<Lower>, OmmlOf<Upper>, OmmlOf<Body>>]
            : readonly [Func<readonly [LimLow<readonly [Run<Symbol>], OmmlOf<Lower>>], OmmlOf<Body>>]
        : false;
type AccentOmml<N extends Notation> =
    N extends AccentNode<infer Accent extends AccentKind, One<infer Base extends Notation>>
        ? readonly [Acc<(typeof ACCENT_OMML)[Accent], OmmlOf<Base>>] : false;

type OmmlOf<N extends Notation> = Extract<FirstMatch<[
    IdentifierOmml<N>,
    NumberOmml<N>,
    OperatorOmml<N>,
    RowOmml<N>,
    FencedOmml<N>,
    BinaryOmml<N>,
    RadicalOmml<N>,
    NaryOmml<N>,
    AccentOmml<N>
]>, XmlContent>;

export type ToOmml<N extends Notation> = OMath<OmmlOf<N>>;
