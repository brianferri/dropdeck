import { frac, nthRoot, oMath, run, sSub, sSup, sqrt } from "@dropdeck/xml/omml";
import { NotationKind } from "#/formula/nodes";
import type { Frac, OMath, Root, Run, SSub, SSup, Sqrt } from "@dropdeck/xml/omml";
import type { Content as XmlContent, Node as XmlNode } from "@dropdeck/xml";
import type { Content, Notation } from "#/formula/nodes";

// OMML has no grouping element, so a row -- and a fence, whose delimiters are just text runs like MathML's `<mo>` --
// flattens its nodes into the enclosing slot. Every rule therefore yields a list that the parent splices in.
type OmmlList<Children extends Content> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? readonly [...OmmlOf<Head>, ...OmmlList<Rest>]
        : readonly [];

type IdentifierOmml<N extends Notation> = N extends { kind: NotationKind.Identifier, symbol: infer Symbol extends string } ? readonly [Run<Symbol>] : false;
type NumberOmml<N extends Notation> = N extends { kind: NotationKind.Number, value: infer Value extends number } ? readonly [Run<`${Value}`>] : false;
type OperatorOmml<N extends Notation> = N extends { kind: NotationKind.Operator, symbol: infer Symbol extends string } ? readonly [Run<Symbol>] : false;
type RowOmml<N extends Notation> = N extends { kind: NotationKind.Row, children: infer Children extends Content } ? OmmlList<Children> : false;
type FencedOmml<N extends Notation> =
    N extends { kind: NotationKind.Fenced, open: infer Open extends string, close: infer Close extends string, children: infer Children extends Content }
        ? readonly [Run<Open>, ...OmmlList<Children>, Run<Close>]
        : false;
type FractionOmml<N extends Notation> =
    N extends { kind: NotationKind.Fraction, children: infer Children extends Content }
        ? Children extends readonly [infer Numerator extends Notation, infer Denominator extends Notation] ? readonly [Frac<OmmlOf<Numerator>, OmmlOf<Denominator>>] : false
        : false;
type SuperscriptOmml<N extends Notation> =
    N extends { kind: NotationKind.Superscript, children: infer Children extends Content }
        ? Children extends readonly [infer Base extends Notation, infer Superscript extends Notation] ? readonly [SSup<OmmlOf<Base>, OmmlOf<Superscript>>] : false
        : false;
type SubscriptOmml<N extends Notation> =
    N extends { kind: NotationKind.Subscript, children: infer Children extends Content }
        ? Children extends readonly [infer Base extends Notation, infer Subscript extends Notation] ? readonly [SSub<OmmlOf<Base>, OmmlOf<Subscript>>] : false
        : false;
type RadicalOmml<N extends Notation> =
    N extends { kind: NotationKind.Radical, children: infer Children extends Content }
        ? Children extends readonly [infer Radicand extends Notation, infer Index extends Notation] ? readonly [Root<OmmlOf<Index>, OmmlOf<Radicand>>]
            : Children extends readonly [infer Radicand extends Notation] ? readonly [Sqrt<OmmlOf<Radicand>>]
                : false
        : false;

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

type OmmlOf<N extends Notation> = Extract<FirstMatch<[
    IdentifierOmml<N>,
    NumberOmml<N>,
    OperatorOmml<N>,
    RowOmml<N>,
    FencedOmml<N>,
    FractionOmml<N>,
    SuperscriptOmml<N>,
    SubscriptOmml<N>,
    RadicalOmml<N>
]>, XmlContent>;

export type ToOmml<N extends Notation> = OMath<OmmlOf<N>>;

function flatten(children: Content): Array<XmlNode> {
    const out: Array<XmlNode> = [];
    for (const child of children) for (const node of ommlNodes(child)) out.push(node);
    return out;
}

// The delimiters are plain text runs; the child list is dynamic, so it is built into an array, not spliced literally.
function fenceRuns(open: string, close: string, children: Content): Array<XmlNode> {
    const items: Array<XmlNode> = [run(open)];
    for (const node of flatten(children)) items.push(node);
    items.push(run(close));
    return items;
}

function ommlNodes(node: Notation): Array<XmlNode> {
    switch (node.kind) {
        case NotationKind.Identifier: return [run(node.symbol)];
        case NotationKind.Number: return [run(String(node.value))];
        case NotationKind.Operator: return [run(node.symbol)];
        case NotationKind.Row: return flatten(node.children);
        case NotationKind.Fenced: return fenceRuns(node.open, node.close, node.children);
        case NotationKind.Fraction: return [frac(ommlNodes(node.children[0]), ommlNodes(node.children[1]))];
        case NotationKind.Superscript: return [sSup(ommlNodes(node.children[0]), ommlNodes(node.children[1]))];
        case NotationKind.Subscript: return [sSub(ommlNodes(node.children[0]), ommlNodes(node.children[1]))];
        case NotationKind.Radical:
            return node.children.length === 2
                ? [nthRoot(ommlNodes(node.children[1]), ommlNodes(node.children[0]))]
                : [sqrt(ommlNodes(node.children[0]))];
    }
}

export function toOmml<const N extends Notation>(node: N): ToOmml<N> {
    return oMath(ommlNodes(node)) as ToOmml<N>;
}
