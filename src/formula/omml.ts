import { OmmlTag, acc, frac, func, limLow, nary, nthRoot, oMath, run, sSub, sSup, sqrt } from "@dropdeck/xml/omml";
import { element } from "@dropdeck/xml";
import { COLOR_HEX, isColorName } from "#/formula/color";
import { AccentKind, LimitPlacement, MathVariant, NotationKind, StyleKind } from "#/formula/nodes";
import { isBigOperatorGlyph } from "#/formula/limit_operator";
import type { Element as XmlElement, Node as XmlNode } from "@dropdeck/xml";
import type { AttributeStyle, Content, Notation } from "#/formula/typings/nodes";
import type { ToOmml } from "./typings/omml.js";

// A font variant restyles a run through math run properties: the weight/shape via `m:sty`, the alphabet via `m:scr`.
export const VARIANT_RPR = {
    [MathVariant.Normal]: [OmmlTag.MathStyle, "p"],
    [MathVariant.Bold]: [OmmlTag.MathStyle, "b"],
    [MathVariant.Italic]: [OmmlTag.MathStyle, "i"],
    [MathVariant.BoldItalic]: [OmmlTag.MathStyle, "bi"],
    [MathVariant.DoubleStruck]: [OmmlTag.Script, "double-struck"],
    [MathVariant.Script]: [OmmlTag.Script, "script"],
    [MathVariant.Fraktur]: [OmmlTag.Script, "fraktur"],
    [MathVariant.SansSerif]: [OmmlTag.Script, "sans-serif"],
    [MathVariant.Monospace]: [OmmlTag.Script, "monospace"]
} as const satisfies Record<MathVariant, readonly [OmmlTag, string]>;

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

// PowerPoint hosts the equation in a DrawingML `a14:m` extension, so a run's color is a DrawingML fill (`a:srgbClr`),
// not WordprocessingML `w:color` -- which that host ignores, unlike the font `m:rPr` that renders in both.
const DRAWINGML_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";

// The `m:rPr` a variant injects (`m:sty` for weight/shape, `m:scr` for the alphabet) and the `a:rPr` a color injects.
export type VariantRPr<V extends MathVariant> =
    XmlElement<OmmlTag.RunProps, readonly [], readonly [XmlElement<(typeof VARIANT_RPR)[V][0], readonly [readonly ["m:val", (typeof VARIANT_RPR)[V][1]]], readonly []>]>;
export type ColorRPr<Hex extends string> = XmlElement<
    "a:rPr",
    readonly [readonly ["xmlns:a", typeof DRAWINGML_NS]],
    readonly [XmlElement<"a:solidFill", readonly [], readonly [XmlElement<"a:srgbClr", readonly [readonly ["val", Hex]], readonly []>]>]
>;

function variantProps<const V extends MathVariant>(variant: V): VariantRPr<V> {
    const [tag, val] = VARIANT_RPR[variant];
    return element(OmmlTag.RunProps, [], [element(tag, [["m:val", val]], [])]);
}

function colorProps<const Hex extends string>(hex: Hex): ColorRPr<Hex> {
    return element("a:rPr", [["xmlns:a", DRAWINGML_NS]], [element("a:solidFill", [], [element("a:srgbClr", [["val", hex]], [])])]);
}

// A run carries its style as run properties: `m:sty`/`m:scr` prepend before the text; `w:color` sits just before it.
function withRunProps(runNode: XmlElement, style: AttributeStyle): XmlNode {
    const children: Array<XmlNode> = runNode.children.slice();
    switch (style.kind) {
        case StyleKind.Variant:
            children.unshift(variantProps(style.variant));
            break;
        case StyleKind.Color:
            if (isColorName(style.color)) children.splice(children.length - 1, 0, colorProps(COLOR_HEX[style.color]));
            break;
    }
    return element(runNode.tag, runNode.attrs, children);
}

const RUN_TAG: string = OmmlTag.Run;

function injectNode(node: XmlNode, style: AttributeStyle): XmlNode {
    if (!("tag" in node)) return node;
    if (node.tag === RUN_TAG) return withRunProps(node, style);
    return element(node.tag, node.attrs, node.children.map((child) => injectNode(child, style)));
}

// OMML has no group style, so a styled group pushes its run properties onto every run it wraps.
function injectRunStyle(nodes: ReadonlyArray<XmlNode>, style: AttributeStyle): Array<XmlNode> {
    return nodes.map((node) => injectNode(node, style));
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
        case NotationKind.LimitOperator:
            if (!isBigOperatorGlyph(node.symbol))
                return [func([limLow([run(node.symbol)], ommlNodes(node.children[0]))], ommlNodes(node.children[2]))];

            return [
                nary(
                    node.symbol,
                    node.style.placement === LimitPlacement.Beside ? "subSup" : "undOvr",
                    ommlNodes(node.children[0]),
                    ommlNodes(node.children[1]),
                    ommlNodes(node.children[2])
                )
            ];
        case NotationKind.Accent: return [acc(ACCENT_OMML[node.accent], ommlNodes(node.children[0]))];
        case NotationKind.Styled: return injectRunStyle(flatten(node.children), node.style);
    }
}

export function toOmml<const N extends Notation>(node: N): ToOmml<N> {
    return oMath(ommlNodes(node)) as ToOmml<N>;
}
