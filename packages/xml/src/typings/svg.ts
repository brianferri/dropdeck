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
