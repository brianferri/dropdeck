import type { Acc, Frac, Func, LimLow, Nary, OMath, OmmlTag, Root, Run, SSub, SSup, Sqrt } from "@dropdeck/xml/omml";
import type { AttrList, Content as XmlContent, Element as XmlElement, Node as XmlNode } from "@dropdeck/xml";
import type { BigOperatorGlyph } from "#/formula/limit_operator";
import type { FirstMatch } from "@dropdeck/common";
import type { AccentKind, LimitPlacement, MathVariant, NotationKind } from "#/formula/nodes";
import type {
    AccentNode, AttributeStyle, ColorStyle, Content, FencedNode, IdentifierNode, LimitOperatorNode, Notation, NumberNode,
    One, OperatorNode, Pair, RadicalNode, RowNode, StyledNode, Triple, VariantStyle
} from "#/formula/typings/nodes";
import type { ACCENT_OMML, ColorRPr, VariantRPr } from "../omml.js";
import type { COLOR_HEX } from "../color.js";

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
type LimitLocation<Placement extends LimitPlacement> = Placement extends LimitPlacement.Beside ? "subSup" : "undOvr";
type LimitOperatorOmml<N extends Notation> =
    N extends LimitOperatorNode<infer Symbol extends string, Triple<infer Lower extends Notation, infer Upper extends Notation, infer Body extends Notation>, infer Placement extends LimitPlacement>
        ? Symbol extends BigOperatorGlyph
            ? readonly [Nary<Symbol, LimitLocation<Placement>, OmmlOf<Lower>, OmmlOf<Upper>, OmmlOf<Body>>]
            : readonly [Func<readonly [LimLow<readonly [Run<Symbol>], OmmlOf<Lower>>], OmmlOf<Body>>]
        : false;
type AccentOmml<N extends Notation> =
    N extends AccentNode<infer Accent extends AccentKind, One<infer Base extends Notation>>
        ? readonly [Acc<(typeof ACCENT_OMML)[Accent], OmmlOf<Base>>] : false;

// A known color name resolves to its `w:color` run property (`ColorRPr`), or `never` for an unknown one.
type ColorWPr<C extends string> = C extends keyof typeof COLOR_HEX ? ColorRPr<(typeof COLOR_HEX)[C]> : never;

// Insert an item just before the last node of a list, so a colored run keeps `m:t` last.
type InsertBeforeLast<Nodes extends XmlContent, Item> =
    Nodes extends readonly [...infer Init extends XmlContent, infer Last] ? readonly [...Init, Item, Last] : Nodes;

// A styled run: a variant prepends its `m:rPr`; a colour slots `w:rPr` in before the text (a bare colour leaves it).
type InjectIntoRun<Attrs extends AttrList, Children extends XmlContent, S extends AttributeStyle> =
    S extends VariantStyle<infer V extends MathVariant> ? XmlElement<OmmlTag.Run, Attrs, readonly [VariantRPr<V>, ...Children]>
        : S extends ColorStyle<infer C extends string>
            ? [ColorWPr<C>] extends [never] ? XmlElement<OmmlTag.Run, Attrs, Children> : XmlElement<OmmlTag.Run, Attrs, InsertBeforeLast<Children, ColorWPr<C>>>
            : XmlElement<OmmlTag.Run, Attrs, Children>;

type InjectNode<Node extends XmlNode, S extends AttributeStyle> =
    Node extends XmlElement<infer Tag extends string, infer Attrs extends AttrList, infer Children extends XmlContent>
        ? Tag extends OmmlTag.Run ? InjectIntoRun<Attrs, Children, S> : XmlElement<Tag, Attrs, InjectRunStyle<Children, S>>
        : Node;

// OMML has no group style, so a styled group pushes its run properties onto every run it wraps.
type InjectRunStyle<Nodes extends XmlContent, S extends AttributeStyle> =
    Nodes extends readonly [infer Head extends XmlNode, ...infer Rest extends XmlContent]
        ? readonly [InjectNode<Head, S>, ...InjectRunStyle<Rest, S>]
        : readonly [];

type StyledOmml<N extends Notation> =
    N extends StyledNode<infer S extends AttributeStyle, infer Children extends Content> ? InjectRunStyle<OmmlList<Children>, S> : false;

type OmmlOf<N extends Notation> = Extract<FirstMatch<[
    IdentifierOmml<N>,
    NumberOmml<N>,
    OperatorOmml<N>,
    RowOmml<N>,
    FencedOmml<N>,
    BinaryOmml<N>,
    RadicalOmml<N>,
    LimitOperatorOmml<N>,
    AccentOmml<N>,
    StyledOmml<N>
]>, XmlContent>;

export type ToOmml<N extends Notation> = OMath<OmmlOf<N>>;
