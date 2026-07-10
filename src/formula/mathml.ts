import { element, text } from "@dropdeck/xml";
import { MATHML_NS, math, mfrac, mi, mn, mo, mroot, msqrt, msub, msup } from "@dropdeck/xml/mathml";
import { NotationKind } from "#/formula/nodes";
import type { Content as XmlContent, Element as XmlElement, Node as XmlNode, Text as XmlText } from "@dropdeck/xml";
import type { Content, Notation } from "#/formula/nodes";

type MathMLNamespace = typeof MATHML_NS;

type Leaf<Tag extends string, Value extends string> = XmlElement<Tag, readonly [], readonly [XmlText & { readonly text: Value }]>;
type Branch<Tag extends string, Children extends XmlContent> = XmlElement<Tag, readonly [], Children>;

type MathMLList<Children extends Content> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? readonly [MathMLOf<Head>, ...MathMLList<Rest>]
        : readonly [];

type MathMLRadical<Children extends Content> =
    Children extends readonly [infer Radicand extends Notation, infer Index extends Notation]
        ? Branch<"mroot", readonly [MathMLOf<Radicand>, MathMLOf<Index>]>
        : Children extends readonly [infer Radicand extends Notation]
            ? Branch<"msqrt", readonly [MathMLOf<Radicand>]>
            : never;

type IdentifierML<N extends Notation> = N extends { kind: NotationKind.Identifier, symbol: infer Symbol extends string } ? Leaf<"mi", Symbol> : false;
type NumberML<N extends Notation> = N extends { kind: NotationKind.Number, value: infer Value extends number } ? Leaf<"mn", `${Value}`> : false;
type OperatorML<N extends Notation> = N extends { kind: NotationKind.Operator, symbol: infer Symbol extends string } ? Leaf<"mo", Symbol> : false;
type RowML<N extends Notation> = N extends { kind: NotationKind.Row, children: infer Children extends Content } ? Branch<"mrow", MathMLList<Children>> : false;
type FencedML<N extends Notation> =
    N extends { kind: NotationKind.Fenced, open: infer Open extends string, close: infer Close extends string, children: infer Children extends Content }
        ? Branch<"mrow", readonly [Leaf<"mo", Open>, ...MathMLList<Children>, Leaf<"mo", Close>]>
        : false;
type FractionML<N extends Notation> = N extends { kind: NotationKind.Fraction, children: infer Children extends Content } ? Branch<"mfrac", MathMLList<Children>> : false;
type SuperscriptML<N extends Notation> = N extends { kind: NotationKind.Superscript, children: infer Children extends Content } ? Branch<"msup", MathMLList<Children>> : false;
type SubscriptML<N extends Notation> = N extends { kind: NotationKind.Subscript, children: infer Children extends Content } ? Branch<"msub", MathMLList<Children>> : false;
type RadicalML<N extends Notation> = N extends { kind: NotationKind.Radical, children: infer Children extends Content } ? MathMLRadical<Children> : false;

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

type MathMLOf<N extends Notation> = Extract<FirstMatch<[
    IdentifierML<N>,
    NumberML<N>,
    OperatorML<N>,
    RowML<N>,
    FencedML<N>,
    FractionML<N>,
    SuperscriptML<N>,
    SubscriptML<N>,
    RadicalML<N>
]>, XmlNode>;

export type ToMathML<N extends Notation> = XmlElement<"math", readonly [readonly ["xmlns", MathMLNamespace]], readonly [MathMLOf<N>]>;

// The delimiters become stretchy `<mo>`; the child list is dynamic, so it is built into an array, not spread into `mrow`.
function fenceRow(open: string, close: string, children: Content): XmlNode {
    const items: Array<XmlNode> = [mo([], text(open))];
    for (const child of children) items.push(mathmlNode(child));
    items.push(mo([], text(close)));
    return element("mrow", [], items);
}

function mathmlNode(node: Notation): XmlNode {
    switch (node.kind) {
        case NotationKind.Identifier: return mi([], text(node.symbol));
        case NotationKind.Number: return mn([], text(String(node.value)));
        case NotationKind.Operator: return mo([], text(node.symbol));
        case NotationKind.Row: return element("mrow", [], node.children.map(mathmlNode));
        case NotationKind.Fenced: return fenceRow(node.open, node.close, node.children);
        case NotationKind.Fraction: return mfrac([], mathmlNode(node.children[0]), mathmlNode(node.children[1]));
        case NotationKind.Superscript: return msup([], mathmlNode(node.children[0]), mathmlNode(node.children[1]));
        case NotationKind.Subscript: return msub([], mathmlNode(node.children[0]), mathmlNode(node.children[1]));
        case NotationKind.Radical:
            return node.children.length === 2
                ? mroot([], mathmlNode(node.children[0]), mathmlNode(node.children[1]))
                : msqrt([], mathmlNode(node.children[0]));
    }
}

export function toMathML<const N extends Notation>(node: N): ToMathML<N> {
    return math([["xmlns", MATHML_NS]], mathmlNode(node)) as ToMathML<N>;
}
