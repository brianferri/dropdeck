import { element, text } from "../builders.js";
import type { Content } from "../typings/nodes.js";
import type { Acc, Delimiter, Frac, Func, LimLow, Nary, OMath, OMathPara, Root, Run, SSub, SSup, Sqrt } from "../typings/omml.js";

export const OMML_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";
export const WML_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export enum OmmlTag {
    Run = "m:r",
    Text = "m:t",
    Fraction = "m:f",
    Numerator = "m:num",
    Denominator = "m:den",
    Superscript = "m:sSup",
    Subscript = "m:sSub",
    Base = "m:e",
    Sup = "m:sup",
    Sub = "m:sub",
    Radical = "m:rad",
    RadicalPr = "m:radPr",
    DegreeHide = "m:degHide",
    Degree = "m:deg",
    Delimiter = "m:d",
    DelimiterPr = "m:dPr",
    BeginChar = "m:begChr",
    EndChar = "m:endChr",
    RunProps = "m:rPr",
    MathStyle = "m:sty",
    Script = "m:scr",
    WordProps = "w:rPr",
    Color = "w:color",
    Nary = "m:nary",
    NaryPr = "m:naryPr",
    Char = "m:chr",
    LimitLocation = "m:limLoc",
    Accent = "m:acc",
    AccentPr = "m:accPr",
    LowerLimit = "m:limLow",
    Limit = "m:lim",
    Function = "m:func",
    FunctionName = "m:fName",
    OMath = "m:oMath",
    OMathPara = "m:oMathPara"
}

export function run<const Value extends string>(value: Value): Run<Value> {
    return element(OmmlTag.Run, [], [element(OmmlTag.Text, [], [text(value)])]);
}

export function frac<const Numerator extends Content, const Denominator extends Content>(numerator: Numerator, denominator: Denominator): Frac<Numerator, Denominator> {
    return element(OmmlTag.Fraction, [], [element(OmmlTag.Numerator, [], numerator), element(OmmlTag.Denominator, [], denominator)]);
}

export function sSup<const Base extends Content, const Superscript extends Content>(base: Base, superscript: Superscript): SSup<Base, Superscript> {
    return element(OmmlTag.Superscript, [], [element(OmmlTag.Base, [], base), element(OmmlTag.Sup, [], superscript)]);
}

export function sSub<const Base extends Content, const Subscript extends Content>(base: Base, subscript: Subscript): SSub<Base, Subscript> {
    return element(OmmlTag.Subscript, [], [element(OmmlTag.Base, [], base), element(OmmlTag.Sub, [], subscript)]);
}

export function sqrt<const Radicand extends Content>(radicand: Radicand): Sqrt<Radicand> {
    return element(OmmlTag.Radical, [], [
        element(OmmlTag.RadicalPr, [], [element(OmmlTag.DegreeHide, [["m:val", "1"]], [])]),
        element(OmmlTag.Degree, [], []),
        element(OmmlTag.Base, [], radicand)
    ]);
}

export function nthRoot<const Degree extends Content, const Radicand extends Content>(degree: Degree, radicand: Radicand): Root<Degree, Radicand> {
    return element(OmmlTag.Radical, [], [element(OmmlTag.Degree, [], degree), element(OmmlTag.Base, [], radicand)]);
}

export function delimiter<const Open extends string, const Close extends string, const Inner extends Content>(open: Open, close: Close, inner: Inner): Delimiter<Open, Close, Inner> {
    return element(OmmlTag.Delimiter, [], [
        element(OmmlTag.DelimiterPr, [], [element(OmmlTag.BeginChar, [["m:val", open]], []), element(OmmlTag.EndChar, [["m:val", close]], [])]),
        element(OmmlTag.Base, [], inner)
    ]);
}

export function nary<
    const Chr extends string,
    const LimLoc extends string,
    const Lower extends Content,
    const Upper extends Content,
    const Body extends Content
>(chr: Chr, limLoc: LimLoc, lower: Lower, upper: Upper, body: Body): Nary<Chr, LimLoc, Lower, Upper, Body> {
    return element(OmmlTag.Nary, [], [
        element(OmmlTag.NaryPr, [], [element(OmmlTag.Char, [["m:val", chr]], []), element(OmmlTag.LimitLocation, [["m:val", limLoc]], [])]),
        element(OmmlTag.Sub, [], lower),
        element(OmmlTag.Sup, [], upper),
        element(OmmlTag.Base, [], body)
    ]);
}

export function limLow<const Base extends Content, const Limit extends Content>(base: Base, limit: Limit): LimLow<Base, Limit> {
    return element(OmmlTag.LowerLimit, [], [element(OmmlTag.Base, [], base), element(OmmlTag.Limit, [], limit)]);
}

export function func<const Name extends Content, const Argument extends Content>(name: Name, argument: Argument): Func<Name, Argument> {
    return element(OmmlTag.Function, [], [element(OmmlTag.FunctionName, [], name), element(OmmlTag.Base, [], argument)]);
}

export function acc<const Chr extends string, const Base extends Content>(chr: Chr, base: Base): Acc<Chr, Base> {
    return element(OmmlTag.Accent, [], [
        element(OmmlTag.AccentPr, [], [element(OmmlTag.Char, [["m:val", chr]], [])]),
        element(OmmlTag.Base, [], base)
    ]);
}

export function oMath<const Body extends Content>(body: Body): OMath<Body> {
    return element(OmmlTag.OMath, [["xmlns:m", OMML_NS]], body);
}

export function oMathPara<const Equation extends Content>(equation: Equation): OMathPara<Equation> {
    return element(OmmlTag.OMathPara, [["xmlns:m", OMML_NS]], equation);
}
