import { element } from "../builders.js";
import type { AssertUniqueAttrs, Content, Element } from "../Specification.js";

// Set as `xmlns` on the root `<svg>` when the markup must stand alone (e.g. rasterised through an `<img>`); inline
// SVG in an HTML document infers it and needs none.
export const SVG_NS = "http://www.w3.org/2000/svg";

/* eslint-disable @typescript-eslint/naming-convention -- SVG presentation attributes are kebab-case by spec (stroke-width, text-anchor, ...). */

// The attributes charts and icons use, with their value types. The builders take attribute *tuples*, not this
// object -- object key order is not recoverable at the type level, so an object could not serialise precisely --
// but the tuples are name- and value-checked against this registry.
type SvgAttrTable = {
    readonly id?: string,
    readonly class?: string,
    readonly transform?: string,
    readonly x?: number | string,
    readonly y?: number | string,
    readonly x1?: number | string,
    readonly y1?: number | string,
    readonly x2?: number | string,
    readonly y2?: number | string,
    readonly cx?: number | string,
    readonly cy?: number | string,
    readonly r?: number | string,
    readonly rx?: number | string,
    readonly ry?: number | string,
    readonly dx?: number | string,
    readonly dy?: number | string,
    readonly width?: number | string,
    readonly height?: number | string,
    readonly d?: string,
    readonly points?: string,
    readonly viewBox?: string,
    readonly xmlns?: string,
    readonly preserveAspectRatio?: string,
    readonly fill?: string,
    readonly stroke?: string,
    readonly opacity?: number | string,
    readonly "fill-opacity"?: number | string,
    readonly "stroke-width"?: number | string,
    readonly "stroke-opacity"?: number | string,
    readonly "stroke-linecap"?: string,
    readonly "stroke-linejoin"?: string,
    readonly "stroke-dasharray"?: string,
    readonly "text-anchor"?: string,
    readonly "dominant-baseline"?: string,
    readonly "font-size"?: number | string,
    readonly "font-family"?: string,
    readonly "font-weight"?: number | string,
    readonly offset?: number | string,
    readonly "stop-color"?: string,
    readonly "stop-opacity"?: number | string,
    readonly gradientUnits?: string
};

/* eslint-enable @typescript-eslint/naming-convention */

export type SvgAttrName = keyof SvgAttrTable;
export type SvgAttr = { [K in SvgAttrName]: readonly [K, NonNullable<SvgAttrTable[K]>] }[SvgAttrName];
export type SvgAttrs = ReadonlyArray<SvgAttr>;

// Variadic children collapse to an empty tuple when none are passed, so a childless element self-closes
// (`<circle/>`); numeric values coerce in the serializer, so a caller writes `["cx", 40]` rather than `["cx", "40"]`.
function svgTag<const Tag extends string>(tag: Tag) {
    return <const A extends SvgAttrs, const C extends Content = readonly []>(
        attrs: A & AssertUniqueAttrs<A>,
        ...children: C
    ): Element<Tag, A, C> => element(tag, attrs, children);
}

export const svg = svgTag("svg");
export const g = svgTag("g");
export const path = svgTag("path");
export const rect = svgTag("rect");
export const circle = svgTag("circle");
export const ellipse = svgTag("ellipse");
export const line = svgTag("line");
export const polyline = svgTag("polyline");
export const polygon = svgTag("polygon");
export const defs = svgTag("defs");
export const linearGradient = svgTag("linearGradient");
export const radialGradient = svgTag("radialGradient");
export const stop = svgTag("stop");

// Named `svgText` so it does not shadow the XML `text()` node builder a caller pairs it with for the label run.
export const svgText = svgTag("text");
export const tspan = svgTag("tspan");

// The number list a `viewBox` or a `points`/coordinate attribute carries, split on the whitespace and commas SVG
// allows between them. A hand scan rather than a regex, so an exponent or sign passes straight to `parseFloat`.
export function numberList(value: string): Array<number> {
    const out: Array<number> = [];
    let token = "";
    for (const character of value) {
        if (character === " " || character === "," || character === "\t" || character === "\n" || character === "\r") {
            if (token !== "") out.push(parseFloat(token));
            token = "";
        } else token += character;
    }
    if (token !== "") out.push(parseFloat(token));
    return out;
}
