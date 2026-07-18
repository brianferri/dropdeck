import type { Content as XmlContent, Element as XmlElement, Node as XmlNode, Text as XmlText } from "@dropdeck/xml";
import type { MATHML_NS, MathMLTag } from "@dropdeck/xml/mathml";
import type { FirstMatch } from "@dropdeck/common";
import type { AccentKind, LimitPlacement, MathVariant, NotationKind } from "#/formula/nodes";
import type {
    AccentNode, AttributeStyle, ColorStyle, Content, FencedNode, IdentifierNode, LimitOperatorNode, Notation, NumberNode, One,
    OperatorNode, Pair, RadicalNode, RowNode, StyledNode, Triple, VariantStyle
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
        ? Branch<MathMLTag.Root, readonly [MathMLOf<Radicand>, MathMLOf<Index>]>
        : Children extends One<infer Radicand extends Notation>
            ? Branch<MathMLTag.Sqrt, readonly [MathMLOf<Radicand>]>
            : never;

type IdentifierML<N extends Notation> = N extends IdentifierNode<infer Symbol extends string> ? Leaf<MathMLTag.Identifier, Symbol> : false;
type NumberML<N extends Notation> = N extends NumberNode<infer Value extends number> ? Leaf<MathMLTag.Number, `${Value}`> : false;
type OperatorML<N extends Notation> = N extends OperatorNode<infer Symbol extends string> ? Leaf<MathMLTag.Operator, Symbol> : false;
type RowML<N extends Notation> = N extends RowNode<infer Children extends Content> ? Branch<MathMLTag.Row, MathMLList<Children>> : false;
type FencedML<N extends Notation> =
    N extends FencedNode<infer Open extends string, infer Close extends string, infer Children extends Content>
        ? Branch<MathMLTag.Row, readonly [Leaf<MathMLTag.Operator, Open>, ...MathMLList<Children>, Leaf<MathMLTag.Operator, Close>]> : false;
type MathMLBranchTag = {
    [NotationKind.Fraction]: MathMLTag.Fraction,
    [NotationKind.Superscript]: MathMLTag.Superscript,
    [NotationKind.Subscript]: MathMLTag.Subscript
};
type BranchML<N extends Notation> =
    N extends { kind: infer K extends keyof MathMLBranchTag, children: infer Children extends Content }
        ? Branch<MathMLBranchTag[K], MathMLList<Children>> : false;
type RadicalML<N extends Notation> = N extends RadicalNode<infer Children extends Content> ? MathMLRadical<Children> : false;
type EmptyLimit<N extends Notation> = N extends RowNode<readonly []> ? true : false;
type LimitScriptsML<Sign extends XmlNode, Beside extends boolean, Lower extends Notation, Upper extends Notation> =
    EmptyLimit<Lower> extends true
        ? EmptyLimit<Upper> extends true ? Sign : Branch<Beside extends true ? MathMLTag.Superscript : MathMLTag.Over, readonly [Sign, MathMLOf<Upper>]>
        : EmptyLimit<Upper> extends true
            ? Branch<Beside extends true ? MathMLTag.Subscript : MathMLTag.Under, readonly [Sign, MathMLOf<Lower>]>
            : Branch<Beside extends true ? MathMLTag.SubSup : MathMLTag.UnderOver, readonly [Sign, MathMLOf<Lower>, MathMLOf<Upper>]>;
type LimitOperatorML<N extends Notation> =
    N extends LimitOperatorNode<infer Symbol extends string, Triple<infer Lower extends Notation, infer Upper extends Notation, infer Body extends Notation>, infer Placement extends LimitPlacement>
        ? Branch<MathMLTag.Row, readonly [LimitScriptsML<Leaf<MathMLTag.Operator, Symbol>, Placement extends LimitPlacement.Beside ? true : false, Lower, Upper>, MathMLOf<Body>]>
        : false;
type AccentML<N extends Notation> =
    N extends AccentNode<infer Accent extends AccentKind, One<infer Base extends Notation>>
        ? XmlElement<MathMLTag.Over, readonly [readonly ["accent", true]], readonly [MathMLOf<Base>, Leaf<MathMLTag.Operator, (typeof ACCENT_MATHML)[Accent]>]>
        : false;

export type StyleAttrML<S extends AttributeStyle> =
    S extends VariantStyle<infer Variant extends MathVariant> ? readonly [readonly ["mathvariant", Variant]]
        : S extends ColorStyle<infer Color extends string> ? readonly [readonly ["mathcolor", Color]] : never;
type StyledML<N extends Notation> =
    N extends StyledNode<infer S extends AttributeStyle, infer Children extends Content>
        ? XmlElement<MathMLTag.Style, StyleAttrML<S>, MathMLList<Children>> : false;

type MathMLOf<N extends Notation> = Extract<FirstMatch<[
    IdentifierML<N>,
    NumberML<N>,
    OperatorML<N>,
    RowML<N>,
    FencedML<N>,
    BranchML<N>,
    RadicalML<N>,
    LimitOperatorML<N>,
    AccentML<N>,
    StyledML<N>
]>, XmlNode>;

export type ToMathML<N extends Notation> = XmlElement<MathMLTag.Math, readonly [readonly ["xmlns", MathMLNamespace]], readonly [MathMLOf<N>]>;
