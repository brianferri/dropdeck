import { element } from "../builders.js";
import type { AssertUniqueAttrs, Content, Element } from "../Specification.js";

export const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

type MathMLAttrTable = {
    readonly id?: string,
    readonly class?: string,
    readonly xmlns?: string,
    readonly mathvariant?: string,
    readonly displaystyle?: boolean,
    readonly scriptlevel?: number | string,
    readonly stretchy?: boolean,
    readonly fence?: boolean,
    readonly separator?: boolean,
    readonly accent?: boolean
};

export type MathMLAttrName = keyof MathMLAttrTable;
export type MathMLAttr = { [K in MathMLAttrName]: readonly [K, NonNullable<MathMLAttrTable[K]>] }[MathMLAttrName];
export type MathMLAttrs = ReadonlyArray<MathMLAttr>;

function mathTag<const Tag extends string>(tag: Tag) {
    return <const A extends MathMLAttrs, const C extends Content = readonly []>(
        attrs: A & AssertUniqueAttrs<A>,
        ...children: C
    ): Element<Tag, A, C> => element(tag, attrs, children);
}

export const math = mathTag("math");
export const mrow = mathTag("mrow");
export const mi = mathTag("mi");
export const mn = mathTag("mn");
export const mo = mathTag("mo");
export const mfrac = mathTag("mfrac");
export const msup = mathTag("msup");
export const msub = mathTag("msub");
export const msqrt = mathTag("msqrt");
export const mroot = mathTag("mroot");
