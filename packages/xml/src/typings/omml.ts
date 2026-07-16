import type { Content, Element, Text } from "./nodes.js";
import type { OMML_NS, OmmlTag } from "../omml/builders.js";

type Slot<Tag extends OmmlTag, Children extends Content> = Element<Tag, readonly [], Children>;
type Property<Tag extends OmmlTag, Value extends string> = Element<Tag, readonly [readonly ["m:val", Value]], readonly []>;

export type Run<Value extends string> = Slot<OmmlTag.Run, readonly [Slot<OmmlTag.Text, readonly [Text & { readonly text: Value }]>]>;
export type Frac<Numerator extends Content, Denominator extends Content> = Slot<OmmlTag.Fraction, readonly [Slot<OmmlTag.Numerator, Numerator>, Slot<OmmlTag.Denominator, Denominator>]>;
export type SSup<Base extends Content, Superscript extends Content> = Slot<OmmlTag.Superscript, readonly [Slot<OmmlTag.Base, Base>, Slot<OmmlTag.Sup, Superscript>]>;
export type SSub<Base extends Content, Subscript extends Content> = Slot<OmmlTag.Subscript, readonly [Slot<OmmlTag.Base, Base>, Slot<OmmlTag.Sub, Subscript>]>;
export type Sqrt<Radicand extends Content> =
    Slot<OmmlTag.Radical, readonly [Slot<OmmlTag.RadicalPr, readonly [Property<OmmlTag.DegreeHide, "1">]>, Slot<OmmlTag.Degree, readonly []>, Slot<OmmlTag.Base, Radicand>]>;
export type Root<Degree extends Content, Radicand extends Content> = Slot<OmmlTag.Radical, readonly [Slot<OmmlTag.Degree, Degree>, Slot<OmmlTag.Base, Radicand>]>;
type DelimiterProps<Open extends string, Close extends string> = Slot<OmmlTag.DelimiterPr, readonly [Property<OmmlTag.BeginChar, Open>, Property<OmmlTag.EndChar, Close>]>;
export type Delimiter<Open extends string, Close extends string, Inner extends Content> = Slot<OmmlTag.Delimiter, readonly [DelimiterProps<Open, Close>, Slot<OmmlTag.Base, Inner>]>;
type NaryProps<Chr extends string, LimLoc extends string> = Slot<OmmlTag.NaryPr, readonly [Property<OmmlTag.Char, Chr>, Property<OmmlTag.LimitLocation, LimLoc>]>;
export type Nary<Chr extends string, LimLoc extends string, Lower extends Content, Upper extends Content, Body extends Content> =
    Slot<OmmlTag.Nary, readonly [NaryProps<Chr, LimLoc>, Slot<OmmlTag.Sub, Lower>, Slot<OmmlTag.Sup, Upper>, Slot<OmmlTag.Base, Body>]>;
type AccentProps<Chr extends string> = Slot<OmmlTag.AccentPr, readonly [Property<OmmlTag.Char, Chr>]>;
export type Acc<Chr extends string, Base extends Content> = Slot<OmmlTag.Accent, readonly [AccentProps<Chr>, Slot<OmmlTag.Base, Base>]>;
export type LimLow<Base extends Content, Limit extends Content> = Slot<OmmlTag.LowerLimit, readonly [Slot<OmmlTag.Base, Base>, Slot<OmmlTag.Limit, Limit>]>;
export type Func<Name extends Content, Argument extends Content> = Slot<OmmlTag.Function, readonly [Slot<OmmlTag.FunctionName, Name>, Slot<OmmlTag.Base, Argument>]>;
export type OMath<Body extends Content> = Element<OmmlTag.OMath, readonly [readonly ["xmlns:m", typeof OMML_NS]], Body>;

export type OMathPara<Equation extends Content> = Element<OmmlTag.OMathPara, readonly [readonly ["xmlns:m", typeof OMML_NS]], Equation>;
