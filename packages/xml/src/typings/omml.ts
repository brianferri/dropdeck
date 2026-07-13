import type { Content, Element, Text } from "./nodes.js";
import type { OMML_NS } from "../omml/builders.js";

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
type NaryProps<Chr extends string, LimLoc extends string> = Slot<"m:naryPr", readonly [Property<"m:chr", Chr>, Property<"m:limLoc", LimLoc>]>;
export type Nary<Chr extends string, LimLoc extends string, Lower extends Content, Upper extends Content, Body extends Content> =
    Slot<"m:nary", readonly [NaryProps<Chr, LimLoc>, Slot<"m:sub", Lower>, Slot<"m:sup", Upper>, Slot<"m:e", Body>]>;
type AccentProps<Chr extends string> = Slot<"m:accPr", readonly [Property<"m:chr", Chr>]>;
export type Acc<Chr extends string, Base extends Content> = Slot<"m:acc", readonly [AccentProps<Chr>, Slot<"m:e", Base>]>;
export type OMath<Body extends Content> = Element<"m:oMath", readonly [readonly ["xmlns:m", typeof OMML_NS]], Body>;

export type OMathPara<Equation extends Content> = Element<"m:oMathPara", readonly [readonly ["xmlns:m", typeof OMML_NS]], Equation>;
