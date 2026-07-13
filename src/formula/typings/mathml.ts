import type { Content as XmlContent, Element as XmlElement, Node as XmlNode, Text as XmlText } from "@dropdeck/xml";
import type { MATHML_NS } from "@dropdeck/xml/mathml";
import type { NaryIntegralGlyph } from "#/formula/nary";
import type { FirstMatch } from "@dropdeck/common";
import type { AccentKind, NotationKind } from "#/formula/nodes";
import type {
    AccentNode, Content, FencedNode, IdentifierNode, NaryNode, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, Triple
} from "#/formula/typings/nodes";
import type { ACCENT_MATHML } from "../mathml.js";

type MathMLNamespace = typeof MATHML_NS;

type Leaf<Tag extends string, Value extends string> = XmlElement<Tag, readonly [], readonly [XmlText & { readonly text: Value }]>;
type Branch<Tag extends string, Children extends XmlContent> = XmlElement<Tag, readonly [], Children>;

type MathMLList<Children extends Content> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? readonly [MathMLOf<Head>, ...MathMLList<Rest>]
        : readonly [];

type MathMLRadical<Children extends Content> =
    Children extends Pair<infer Radicand extends Notation, infer Index extends Notation>
        ? Branch<"mroot", readonly [MathMLOf<Radicand>, MathMLOf<Index>]>
        : Children extends One<infer Radicand extends Notation>
            ? Branch<"msqrt", readonly [MathMLOf<Radicand>]>
            : never;

type IdentifierML<N extends Notation> = N extends IdentifierNode<infer Symbol extends string> ? Leaf<"mi", Symbol> : false;
type NumberML<N extends Notation> = N extends NumberNode<infer Value extends number> ? Leaf<"mn", `${Value}`> : false;
type OperatorML<N extends Notation> = N extends OperatorNode<infer Symbol extends string> ? Leaf<"mo", Symbol> : false;
type RowML<N extends Notation> = N extends RowNode<infer Children extends Content> ? Branch<"mrow", MathMLList<Children>> : false;
type FencedML<N extends Notation> =
    N extends FencedNode<infer Open extends string, infer Close extends string, infer Children extends Content>
        ? Branch<"mrow", readonly [Leaf<"mo", Open>, ...MathMLList<Children>, Leaf<"mo", Close>]> : false;
// Fraction, superscript, and subscript are each an `mrow`-less list wrapped in one element; kind picks the tag.
type MathMLBranchTag = {
    [NotationKind.Fraction]: "mfrac",
    [NotationKind.Superscript]: "msup",
    [NotationKind.Subscript]: "msub"
};
type BranchML<N extends Notation> =
    N extends { kind: infer K extends keyof MathMLBranchTag, children: infer Children extends Content }
        ? Branch<MathMLBranchTag[K], MathMLList<Children>> : false;
type RadicalML<N extends Notation> = N extends RadicalNode<infer Children extends Content> ? MathMLRadical<Children> : false;
type NaryScript<Symbol extends string> = Symbol extends NaryIntegralGlyph ? "msubsup" : "munderover";
type NaryML<N extends Notation> =
    N extends NaryNode<infer Symbol extends string, Triple<infer Lower extends Notation, infer Upper extends Notation, infer Body extends Notation>>
        ? Branch<"mrow", readonly [Branch<NaryScript<Symbol>, readonly [Leaf<"mo", Symbol>, MathMLOf<Lower>, MathMLOf<Upper>]>, MathMLOf<Body>]>
        : false;
type AccentML<N extends Notation> =
    N extends AccentNode<infer Accent extends AccentKind, One<infer Base extends Notation>>
        ? XmlElement<"mover", readonly [readonly ["accent", true]], readonly [MathMLOf<Base>, Leaf<"mo", (typeof ACCENT_MATHML)[Accent]>]>
        : false;

type MathMLOf<N extends Notation> = Extract<FirstMatch<[
    IdentifierML<N>,
    NumberML<N>,
    OperatorML<N>,
    RowML<N>,
    FencedML<N>,
    BranchML<N>,
    RadicalML<N>,
    NaryML<N>,
    AccentML<N>
]>, XmlNode>;

export type ToMathML<N extends Notation> = XmlElement<"math", readonly [readonly ["xmlns", MathMLNamespace]], readonly [MathMLOf<N>]>;
