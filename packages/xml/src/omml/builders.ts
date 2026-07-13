import { element, text } from "../builders.js";
import type { Content } from "../typings/nodes.js";
import type { Acc, Delimiter, Frac, Nary, OMath, OMathPara, Root, Run, SSub, SSup, Sqrt } from "../typings/omml.js";

export const OMML_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";

export function run<const Value extends string>(value: Value): Run<Value> {
    return element("m:r", [], [element("m:t", [], [text(value)])]);
}

export function frac<const Numerator extends Content, const Denominator extends Content>(numerator: Numerator, denominator: Denominator): Frac<Numerator, Denominator> {
    return element("m:f", [], [element("m:num", [], numerator), element("m:den", [], denominator)]);
}

export function sSup<const Base extends Content, const Superscript extends Content>(base: Base, superscript: Superscript): SSup<Base, Superscript> {
    return element("m:sSup", [], [element("m:e", [], base), element("m:sup", [], superscript)]);
}

export function sSub<const Base extends Content, const Subscript extends Content>(base: Base, subscript: Subscript): SSub<Base, Subscript> {
    return element("m:sSub", [], [element("m:e", [], base), element("m:sub", [], subscript)]);
}

export function sqrt<const Radicand extends Content>(radicand: Radicand): Sqrt<Radicand> {
    return element("m:rad", [], [
        element("m:radPr", [], [element("m:degHide", [["m:val", "1"]], [])]),
        element("m:deg", [], []),
        element("m:e", [], radicand)
    ]);
}

export function nthRoot<const Degree extends Content, const Radicand extends Content>(degree: Degree, radicand: Radicand): Root<Degree, Radicand> {
    return element("m:rad", [], [element("m:deg", [], degree), element("m:e", [], radicand)]);
}

export function delimiter<const Open extends string, const Close extends string, const Inner extends Content>(open: Open, close: Close, inner: Inner): Delimiter<Open, Close, Inner> {
    return element("m:d", [], [
        element("m:dPr", [], [element("m:begChr", [["m:val", open]], []), element("m:endChr", [["m:val", close]], [])]),
        element("m:e", [], inner)
    ]);
}

export function nary<
    const Chr extends string,
    const LimLoc extends string,
    const Lower extends Content,
    const Upper extends Content,
    const Body extends Content
>(chr: Chr, limLoc: LimLoc, lower: Lower, upper: Upper, body: Body): Nary<Chr, LimLoc, Lower, Upper, Body> {
    return element("m:nary", [], [
        element("m:naryPr", [], [element("m:chr", [["m:val", chr]], []), element("m:limLoc", [["m:val", limLoc]], [])]),
        element("m:sub", [], lower),
        element("m:sup", [], upper),
        element("m:e", [], body)
    ]);
}

export function acc<const Chr extends string, const Base extends Content>(chr: Chr, base: Base): Acc<Chr, Base> {
    return element("m:acc", [], [
        element("m:accPr", [], [element("m:chr", [["m:val", chr]], [])]),
        element("m:e", [], base)
    ]);
}

export function oMath<const Body extends Content>(body: Body): OMath<Body> {
    return element("m:oMath", [["xmlns:m", OMML_NS]], body);
}

export function oMathPara<const Equation extends Content>(equation: Equation): OMathPara<Equation> {
    return element("m:oMathPara", [["xmlns:m", OMML_NS]], equation);
}
