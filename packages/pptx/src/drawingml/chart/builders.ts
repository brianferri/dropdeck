import { Namespace, element, text } from "../../oox.js";
import { ST_AxPos, ST_BarDir, ST_BarGrouping, ST_Orientation } from "./Specification.js";
import type { AttrScalar, Element, Empty, Node, QName, Text } from "../../oox.js";

type CV<Local extends string, V extends AttrScalar> = Element<QName<"c", Local>, readonly [readonly ["val", V]], Empty>;
type CTxt<Local extends string, S extends string> = Element<QName<"c", Local>, Empty, readonly [Text & { readonly text: S }]>;
type Pt<S extends string, I extends number = number> = Element<QName<"c", "pt">, readonly [readonly ["idx", I]], readonly [CTxt<"v", S>]>;

// Mapping over the label/value tuple keeps the cache a precise `[pt, pt]` tuple, not an unbounded `Pt[]` the
// serialiser would drop; the tuple key `K` is reused as each point's zero-based `idx`.
type IdxOf<K> = K extends `${infer I extends number}` ? I : number;
type StrPts<L extends ReadonlyArray<string>> = { readonly [K in keyof L]: Pt<L[K], IdxOf<K>> };
type NumPts<N extends ReadonlyArray<number>> = { readonly [K in keyof N]: Pt<`${N[K] & number}`, IdxOf<K>> };

type StrCacheOf<L extends ReadonlyArray<string>> = Element<QName<"c", "strCache">, Empty, readonly [CV<"ptCount", L["length"]>, ...StrPts<L>]>;
type NumCacheOf<N extends ReadonlyArray<number>, F extends string> = Element<QName<"c", "numCache">, Empty, readonly [CTxt<"formatCode", F>, CV<"ptCount", N["length"]>, ...NumPts<N>]>;
type StrRefOf<F extends string, L extends ReadonlyArray<string>> = Element<QName<"c", "strRef">, Empty, readonly [CTxt<"f", F>, StrCacheOf<L>]>;
type NumRefOf<F extends string, N extends ReadonlyArray<number>, FC extends string> = Element<QName<"c", "numRef">, Empty, readonly [CTxt<"f", F>, NumCacheOf<N, FC>]>;
type AnyStrRef = Element<QName<"c", "strRef">, Empty>;
type AnyNumRef = Element<QName<"c", "numRef">, Empty>;
type ScalingEl = Element<QName<"c", "scaling">, Empty, readonly [CV<"orientation", ST_Orientation.MinMax>]>;

export function cval<const Local extends string, const V extends AttrScalar>(local: Local, val: V): CV<Local, V> {
    return element(`c:${local}`, [["val", val]], []);
}

export function ctext<const Local extends string, const S extends string>(local: Local, content: S): CTxt<Local, S> {
    return element(`c:${local}`, [], [text(content)]);
}

export function point<const S extends string>(index: number, content: S): Pt<S> {
    return element("c:pt", [["idx", index]], [ctext("v", content)]);
}

// A cache mixes a fixed head with a variable run of points. A spread-free build lands as `Node[]`, which a single
// `as` (never `as unknown` -- the element is concrete) narrows back to the exact mapped tuple.
export function strCache<const L extends ReadonlyArray<string>>(labels: L): StrCacheOf<L> {
    const kids: Array<Node> = [cval("ptCount", labels.length)];
    labels.forEach((label, index) => kids.push(point(index, label)));
    const ordered: ReadonlyArray<Node> = kids;
    return element("c:strCache", [], ordered) as StrCacheOf<L>;
}

export function numCache<const N extends ReadonlyArray<number>, const F extends string>(values: N, formatCode: F): NumCacheOf<N, F> {
    const kids: Array<Node> = [ctext("formatCode", formatCode), cval("ptCount", values.length)];
    values.forEach((v, index) => kids.push(point(index, String(v))));
    const ordered: ReadonlyArray<Node> = kids;
    return element("c:numCache", [], ordered) as NumCacheOf<N, F>;
}

export function strRef<const F extends string, const L extends ReadonlyArray<string>>(formula: F, labels: L): StrRefOf<F, L> {
    return element("c:strRef", [], [ctext("f", formula), strCache(labels)]);
}

export function numRef<const F extends string, const N extends ReadonlyArray<number>, const FC extends string>(formula: F, values: N, formatCode: FC): NumRefOf<F, N, FC> {
    return element("c:numRef", [], [ctext("f", formula), numCache(values, formatCode)]);
}

export function seriesName<const R extends AnyStrRef>(ref: R): Element<QName<"c", "tx">, Empty, readonly [R]> {
    return element("c:tx", [], [ref]);
}

export function categories<const R extends AnyStrRef>(ref: R): Element<QName<"c", "cat">, Empty, readonly [R]> {
    return element("c:cat", [], [ref]);
}

export function numbers<const R extends AnyNumRef>(ref: R): Element<QName<"c", "val">, Empty, readonly [R]> {
    return element("c:val", [], [ref]);
}

export function barSeries<const I extends number, const N extends Node, const C extends Node, const V extends Node>(
    index: I,
    name: N,
    cats: C,
    vals: V
): Element<QName<"c", "ser">, Empty, readonly [CV<"idx", I>, CV<"order", I>, N, C, V]> {
    return element("c:ser", [], [cval("idx", index), cval("order", index), name, cats, vals]);
}

function scaling(): ScalingEl {
    return element("c:scaling", [], [cval("orientation", ST_Orientation.MinMax)]);
}

export function categoryAxis<const A extends number, const X extends number>(
    axId: A,
    crossAxId: X
): Element<QName<"c", "catAx">, Empty, readonly [CV<"axId", A>, ScalingEl, CV<"delete", false>, CV<"axPos", ST_AxPos.Bottom>, CV<"crossAx", X>]> {
    return element("c:catAx", [], [cval("axId", axId), scaling(), cval("delete", false), cval("axPos", ST_AxPos.Bottom), cval("crossAx", crossAxId)]);
}

export function valueAxis<const A extends number, const X extends number>(
    axId: A,
    crossAxId: X
): Element<QName<"c", "valAx">, Empty, readonly [CV<"axId", A>, ScalingEl, CV<"delete", false>, CV<"axPos", ST_AxPos.Left>, CV<"crossAx", X>]> {
    return element("c:valAx", [], [cval("axId", axId), scaling(), cval("delete", false), cval("axPos", ST_AxPos.Left), cval("crossAx", crossAxId)]);
}

type BarChartEl<S extends ReadonlyArray<Node>, CA extends number, VA extends number> = Element<
    QName<"c", "barChart">,
    Empty,
    readonly [CV<"barDir", ST_BarDir.Col>, CV<"grouping", ST_BarGrouping.Clustered>, ...S, CV<"gapWidth", 150>, CV<"axId", CA>, CV<"axId", VA>]
>;

// Series sit between a fixed head (`barDir`, `grouping`) and a fixed tail (`gapWidth`, two `axId`), so it needs
// the same spread-free build + single `as` the caches use.
export function barChart<const S extends ReadonlyArray<Node>, const CA extends number, const VA extends number>(
    series: S,
    catAxId: CA,
    valAxId: VA
): BarChartEl<S, CA, VA> {
    const kids: Array<Node> = [cval("barDir", ST_BarDir.Col), cval("grouping", ST_BarGrouping.Clustered)];
    series.forEach((one) => kids.push(one));
    kids.push(cval("gapWidth", 150), cval("axId", catAxId), cval("axId", valAxId));
    const ordered: ReadonlyArray<Node> = kids;
    return element("c:barChart", [], ordered) as BarChartEl<S, CA, VA>;
}

export function plotArea<const B extends Node, const C extends Node, const V extends Node>(
    chartGroup: B,
    catAx: C,
    valAx: V
): Element<QName<"c", "plotArea">, Empty, readonly [Element<QName<"c", "layout">, Empty, Empty>, B, C, V]> {
    return element("c:plotArea", [], [element("c:layout", [], []), chartGroup, catAx, valAx]);
}

export function chart<const A extends Node>(area: A): Element<QName<"c", "chart">, Empty, readonly [CV<"autoTitleDeleted", true>, A, CV<"plotVisOnly", true>]> {
    return element("c:chart", [], [cval("autoTitleDeleted", true), area, cval("plotVisOnly", true)]);
}

// The `r:id` resolves (through the chart part's rels) to the embedded `.xlsx`, so a viewer can edit the data.
export function externalData<const R extends string>(relId: R): Element<QName<"c", "externalData">, readonly [readonly ["r:id", R]], readonly [CV<"autoUpdate", false>]> {
    return element("c:externalData", [["r:id", relId]], [cval("autoUpdate", false)]);
}

type ChartSpaceAttrs = readonly [readonly ["xmlns:c", Namespace.c], readonly ["xmlns:a", Namespace.a], readonly ["xmlns:r", Namespace.r]];
export function chartSpace<const B extends Node, const D extends Node>(body: B, data: D): Element<QName<"c", "chartSpace">, ChartSpaceAttrs, readonly [B, D]> {
    return element("c:chartSpace", [["xmlns:c", Namespace.c], ["xmlns:a", Namespace.a], ["xmlns:r", Namespace.r]], [body, data]);
}

// A `<c:chart r:id="...">` reference for a slide's `a:graphicData`; it points at the chart part.
type RelIdAttrs<R extends string> = readonly [readonly ["xmlns:c", Namespace.c], readonly ["xmlns:r", Namespace.r], readonly ["r:id", R]];
export function chartRef<const R extends string>(relId: R): Element<QName<"c", "chart">, RelIdAttrs<R>, Empty> {
    return element("c:chart", [["xmlns:c", Namespace.c], ["xmlns:r", Namespace.r], ["r:id", relId]], []);
}
