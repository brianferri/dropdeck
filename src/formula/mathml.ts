import { element, text } from "@dropdeck/xml";
import { MATHML_NS, math, mfrac, mi, mn, mo, mover, mroot, msqrt, msub, msup } from "@dropdeck/xml/mathml";
import { AccentKind, NotationKind } from "#/formula/nodes";
import { isNaryIntegralGlyph } from "#/formula/nary";
import type { Node as XmlNode } from "@dropdeck/xml";
import type { Content, Notation } from "#/formula/typings/nodes";
import type { ToMathML } from "./typings/mathml.js";

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
        case NotationKind.Nary:
            return element("mrow", [], [
                element(
                    isNaryIntegralGlyph(node.symbol) ? "msubsup" : "munderover",
                    [],
                    [
                        mo([], text(node.symbol)),
                        mathmlNode(node.children[0]),
                        mathmlNode(node.children[1])
                    ]
                ),
                mathmlNode(node.children[2])
            ]);
        case NotationKind.Accent:
            return mover([["accent", true]], mathmlNode(node.children[0]), mo([], text(ACCENT_MATHML[node.accent])));
    }
}

export function toMathML<const N extends Notation>(node: N): ToMathML<N> {
    return math([["xmlns", MATHML_NS]], mathmlNode(node)) as ToMathML<N>;
}
