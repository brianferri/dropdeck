import { acc, frac, nary, nthRoot, oMath, run, sSub, sSup, sqrt } from "@dropdeck/xml/omml";
import { AccentKind, NotationKind } from "#/formula/nodes";
import { isNaryIntegralGlyph } from "#/formula/nary";
import type { Node as XmlNode } from "@dropdeck/xml";
import type { Content, Notation } from "#/formula/typings/nodes";
import type { ToOmml } from "./typings/omml.js";

// Word marks accents with the combining glyph (drawn over `m:e`); one table drives both the type and the runtime.
// The marks are combining code points, so they are written as escapes to avoid attaching to the source quote.
export const ACCENT_OMML = {
    [AccentKind.Hat]: "̂",
    [AccentKind.Vec]: "⃗",
    [AccentKind.Bar]: "̄",
    [AccentKind.Tilde]: "̃",
    [AccentKind.Dot]: "̇",
    [AccentKind.Ddot]: "̈",
    [AccentKind.Overline]: "̅"
} as const satisfies Record<AccentKind, string>;

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
        case NotationKind.Nary:
            return [
                nary(
                    node.symbol,
                    isNaryIntegralGlyph(node.symbol) ? "subSup" : "undOvr",
                    ommlNodes(node.children[0]),
                    ommlNodes(node.children[1]),
                    ommlNodes(node.children[2])
                )
            ];
        case NotationKind.Accent: return [acc(ACCENT_OMML[node.accent], ommlNodes(node.children[0]))];
    }
}

export function toOmml<const N extends Notation>(node: N): ToOmml<N> {
    return oMath(ommlNodes(node)) as ToOmml<N>;
}
