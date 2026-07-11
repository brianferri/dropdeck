import { element, text } from "../builders.js";
import type { Content, Element, Text } from "../Specification.js";

export const OMML_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";

type Slot<Tag extends string, Children extends Content> = Element<Tag, readonly [], Children>;
type Property<Tag extends string, Value extends string> = Element<Tag, readonly [readonly ["m:val", Value]], readonly []>;

export type Run<Value extends string> = Slot<"m:r", readonly [Slot<"m:t", readonly [Text & { readonly text: Value }]>]>;
export type Frac<Numerator extends Content, Denominator extends Content> = Slot<"m:f", readonly [Slot<"m:num", Numerator>, Slot<"m:den", Denominator>]>;
export type SSup<Base extends Content, Superscript extends Content> = Slot<"m:sSup", readonly [Slot<"m:e", Base>, Slot<"m:sup", Superscript>]>;
export type SSub<Base extends Content, Subscript extends Content> = Slot<"m:sSub", readonly [Slot<"m:e", Base>, Slot<"m:sub", Subscript>]>;
export type Sqrt<Radicand extends Content> = Slot<"m:rad", readonly [Slot<"m:radPr", readonly [Property<"m:degHide", "1">]>, Slot<"m:deg", readonly []>, Slot<"m:e", Radicand>]>;
export type Root<Degree extends Content, Radicand extends Content> = Slot<"m:rad", readonly [Slot<"m:deg", Degree>, Slot<"m:e", Radicand>]>;
type DelimiterProps<Open extends string, Close extends string> = Slot<"m:dPr", readonly [Property<"m:begChr", Open>, Property<"m:endChr", Close>]>;
export type Delimiter<Open extends string, Close extends string, Inner extends Content> = Slot<"m:d", readonly [DelimiterProps<Open, Close>, Slot<"m:e", Inner>]>;
export type OMath<Body extends Content> = Element<"m:oMath", readonly [readonly ["xmlns:m", typeof OMML_NS]], Body>;

export type OMathPara<Equation extends Content> = Element<"m:oMathPara", readonly [readonly ["xmlns:m", typeof OMML_NS]], Equation>;

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

export function oMath<const Body extends Content>(body: Body): OMath<Body> {
    return element("m:oMath", [["xmlns:m", OMML_NS]], body);
}

export function oMathPara<const Equation extends Content>(equation: Equation): OMathPara<Equation> {
    return element("m:oMathPara", [["xmlns:m", OMML_NS]], equation);
}
