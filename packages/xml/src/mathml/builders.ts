import { element } from "../builders.js";
import type { AssertUniqueAttrs, Content, Element } from "../typings/nodes.js";
import type { MathMLAttrs } from "../typings/mathml.js";

export const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

export enum MathMLTag {
    Math = "math",
    Row = "mrow",
    Identifier = "mi",
    Number = "mn",
    Operator = "mo",
    Fraction = "mfrac",
    Superscript = "msup",
    Subscript = "msub",
    Sqrt = "msqrt",
    Root = "mroot",
    Under = "munder",
    Over = "mover",
    UnderOver = "munderover",
    SubSup = "msubsup"
}

function mathTag<const Tag extends MathMLTag>(tag: Tag) {
    return <const A extends MathMLAttrs, const C extends Content = readonly []>(
        attrs: A & AssertUniqueAttrs<A>,
        ...children: C
    ): Element<Tag, A, C> => element(tag, attrs, children);
}

export const math = mathTag(MathMLTag.Math);
export const mrow = mathTag(MathMLTag.Row);
export const mi = mathTag(MathMLTag.Identifier);
export const mn = mathTag(MathMLTag.Number);
export const mo = mathTag(MathMLTag.Operator);
export const mfrac = mathTag(MathMLTag.Fraction);
export const msup = mathTag(MathMLTag.Superscript);
export const msub = mathTag(MathMLTag.Subscript);
export const msqrt = mathTag(MathMLTag.Sqrt);
export const mroot = mathTag(MathMLTag.Root);
export const munder = mathTag(MathMLTag.Under);
export const mover = mathTag(MathMLTag.Over);
export const munderover = mathTag(MathMLTag.UnderOver);
export const msubsup = mathTag(MathMLTag.SubSup);
