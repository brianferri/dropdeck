import { element, text } from "@dropdeck/xml";
import { MATHML_NS, MathMLTag, math, mfrac, mi, mn, mo, mover, mroot, msqrt, msub, msup } from "@dropdeck/xml/mathml";
import { AccentKind, LimitPlacement, NotationKind, StyleKind } from "#/formula/nodes";
import type { Node as XmlNode } from "@dropdeck/xml";
import type { AttributeStyle, Content, Notation } from "#/formula/typings/nodes";
import type { StyleAttrML, ToMathML } from "./typings/mathml.js";

export const ACCENT_MATHML = {
    [AccentKind.Hat]: "^",
    [AccentKind.Vec]: "→",
    [AccentKind.Bar]: "‾",
    [AccentKind.Tilde]: "~",
    [AccentKind.Dot]: "˙",
    [AccentKind.Ddot]: "¨",
    [AccentKind.Overline]: "‾"
} as const satisfies Record<AccentKind, string>;

// The delimiters become stretchy `<mo>`; the child list is dynamic, so it is built into an array, not spread into `mrow`.
function fenceRow(open: string, close: string, children: Content): XmlNode {
    const items: Array<XmlNode> = [mo([], text(open))];
    for (const child of children) items.push(mathmlNode(child));
    items.push(mo([], text(close)));
    return element(MathMLTag.Row, [], items);
}

function isEmptyRow(node: Notation): boolean {
    return node.kind === NotationKind.Row && node.children.length === 0;
}

function limitScripts(symbol: string, placement: LimitPlacement, lower: Notation, upper: Notation): XmlNode {
    const beside = placement === LimitPlacement.Beside;
    const sign = mo([], text(symbol));
    if (isEmptyRow(lower) && isEmptyRow(upper)) return sign;
    if (isEmptyRow(upper)) return element(beside ? MathMLTag.Subscript : MathMLTag.Under, [], [sign, mathmlNode(lower)]);
    if (isEmptyRow(lower)) return element(beside ? MathMLTag.Superscript : MathMLTag.Over, [], [sign, mathmlNode(upper)]);
    return element(beside ? MathMLTag.SubSup : MathMLTag.UnderOver, [], [sign, mathmlNode(lower), mathmlNode(upper)]);
}

/** Builds the `<mstyle>` presentation attribute for a styled group: the variant on `mathvariant`, the color on `mathcolor`. */
function styleAttrs(style: AttributeStyle): StyleAttrML<AttributeStyle> {
    switch (style.kind) {
        case StyleKind.Variant: return [["mathvariant", style.variant]];
        case StyleKind.Color: return [["mathcolor", style.color]];
    }
}

function mathmlNode(node: Notation): XmlNode {
    switch (node.kind) {
        case NotationKind.Identifier: return mi([], text(node.symbol));
        case NotationKind.Number: return mn([], text(String(node.value)));
        case NotationKind.Operator: return mo([], text(node.symbol));
        case NotationKind.Row: return element(MathMLTag.Row, [], node.children.map(mathmlNode));
        case NotationKind.Fenced: return fenceRow(node.open, node.close, node.children);
        case NotationKind.Fraction: return mfrac([], mathmlNode(node.children[0]), mathmlNode(node.children[1]));
        case NotationKind.Superscript: return msup([], mathmlNode(node.children[0]), mathmlNode(node.children[1]));
        case NotationKind.Subscript: return msub([], mathmlNode(node.children[0]), mathmlNode(node.children[1]));
        case NotationKind.Radical:
            return node.children.length === 2
                ? mroot([], mathmlNode(node.children[0]), mathmlNode(node.children[1]))
                : msqrt([], mathmlNode(node.children[0]));
        case NotationKind.LimitOperator:
            return element(MathMLTag.Row, [], [
                limitScripts(node.symbol, node.style.placement, node.children[0], node.children[1]),
                mathmlNode(node.children[2])
            ]);
        case NotationKind.Accent:
            return mover([["accent", true]], mathmlNode(node.children[0]), mo([], text(ACCENT_MATHML[node.accent])));
        case NotationKind.Styled:
            return element(MathMLTag.Style, styleAttrs(node.style), node.children.map(mathmlNode));
    }
}

export function toMathML<const N extends Notation>(node: N): ToMathML<N> {
    return math([["xmlns", MATHML_NS]], mathmlNode(node)) as ToMathML<N>;
}
