import { element, text } from "@dropdeck/xml";
import type { AssertUniqueAttrs, Element, Empty, Node, Text } from "@dropdeck/xml";
import type {
    BodyPropertyAttr,
    CT_AdjPoint2D,
    CT_GeomGuide,
    CT_Path2D,
    CT_Path2DCommand,
    CT_Path2DList,
    CT_GraphicalObjectData,
    CT_Highlight,
    CT_TextSpacingPercent,
    CT_TextSpacingPoint,
    CT_ChildOffset2D,
    CT_ChildSize2D,
    CT_Point2D,
    CT_PositiveSize2D,
    CT_RegularTextRun,
    CT_SolidColorFillProperties,
    CT_SRgbColor,
    CT_TableCell,
    CT_TableCellProperties,
    CT_TableCol,
    CT_TableGrid,
    CT_TableProperties,
    CT_TableRow,
    CT_TableStyleId,
    CT_TextBody,
    CT_TextCharacterProperties,
    CT_TextFont,
    CT_TextParagraph,
    CT_Transform2D,
    ParagraphPropertyAttr,
    RunPropertyAttr,
    ST_Coordinate,
    ST_PositiveCoordinate,
    ST_ShapeType,
    TableCellPropertyAttr,
    TablePropertyAttr
} from "../typings/drawingml.js";
import type { ValidateHexColor } from "../typings/drawingml.js";

export function off<const X extends ST_Coordinate, const Y extends ST_Coordinate>(
    x: X,
    y: Y
): Element<"a:off", readonly [readonly ["x", X], readonly ["y", Y]], Empty> {
    return element("a:off", [["x", x], ["y", y]], []);
}

export function ext<
    const Cx extends ST_PositiveCoordinate,
    const Cy extends ST_PositiveCoordinate
>(cx: Cx, cy: Cy): Element<
    "a:ext",
    readonly [readonly ["cx", Cx], readonly ["cy", Cy]],
    Empty
> {
    return element("a:ext", [["cx", cx], ["cy", cy]], []);
}

export function xfrm<const O extends CT_Point2D, const E extends CT_PositiveSize2D>(
    offset: O,
    extent: E
): Element<"a:xfrm", Empty, readonly [O, E]>;

// OOXML angles are 1/60000 of a degree. Rotation is a separate overload so an unrotated shape keeps the bare,
// attribute-free `<a:xfrm>` its precise serialised type depends on.
export function xfrm<const O extends CT_Point2D, const E extends CT_PositiveSize2D, const R extends number>(
    offset: O,
    extent: E,
    rotation: R
): Element<"a:xfrm", readonly [readonly ["rot", R]], readonly [O, E]>;
export function xfrm(offset: CT_Point2D, extent: CT_PositiveSize2D, rotation?: number): CT_Transform2D {
    if (rotation === undefined) return element("a:xfrm", [], [offset, extent]);
    return element("a:xfrm", [["rot", rotation]], [offset, extent]);
}

// A group shape's child coordinate origin and size. Mirroring `chOff`/`chExt` to a group's `off`/`ext` maps the
// child space 1:1 onto the group box, so children keep the absolute coordinates they were laid out with.
export function chOff<const X extends ST_Coordinate, const Y extends ST_Coordinate>(
    x: X,
    y: Y
): Element<"a:chOff", readonly [readonly ["x", X], readonly ["y", Y]], Empty> {
    return element("a:chOff", [["x", x], ["y", y]], []);
}

export function chExt<
    const Cx extends ST_PositiveCoordinate,
    const Cy extends ST_PositiveCoordinate
>(cx: Cx, cy: Cy): Element<"a:chExt", readonly [readonly ["cx", Cx], readonly ["cy", Cy]], Empty> {
    return element("a:chExt", [["cx", cx], ["cy", cy]], []);
}

// A group transform carries the child origin/size the plain `xfrm` omits, so a `p:grpSp` places its children.
export function groupXfrm<
    const O extends CT_Point2D,
    const E extends CT_PositiveSize2D,
    const CO extends CT_ChildOffset2D,
    const CE extends CT_ChildSize2D
>(offset: O, extent: E, childOffset: CO, childExtent: CE): Element<"a:xfrm", Empty, readonly [O, E, CO, CE]> {
    return element("a:xfrm", [], [offset, extent, childOffset, childExtent]);
}

// Opacity in thousandths of a percent (100000 = opaque).
export function alpha<const P extends number>(value: P): Element<"a:alpha", readonly [readonly ["val", P]], Empty> {
    return element("a:alpha", [["val", value]], []);
}

// `S & ValidateHexColor<S>` collapses to `never` for any non-six-hex literal, so a bad colour fails at the call.
export function srgbClr<const S extends string>(val: S & ValidateHexColor<S>): Element<"a:srgbClr", readonly [readonly ["val", S]], Empty> {
    return element("a:srgbClr", [["val", val as S]], []);
}

export function solidFill<const C extends CT_SRgbColor>(color: C): Element<"a:solidFill", Empty, readonly [C]> {
    return element("a:solidFill", [], [color]);
}

export function gd<const N extends string, const F extends string>(
    name: N,
    fmla: F
): Element<"a:gd", readonly [readonly ["name", N], readonly ["fmla", F]], Empty> {
    return element("a:gd", [["name", name], ["fmla", fmla]], []);
}

export function prstGeom<const P extends ST_ShapeType, const G extends ReadonlyArray<CT_GeomGuide>>(
    prst: P,
    ...guides: G
): Element<"a:prstGeom", readonly [readonly ["prst", P]], readonly [Element<"a:avLst", Empty, G>]> {
    return element("a:prstGeom", [["prst", prst]], [element("a:avLst", [], guides)]);
}

// `adjust` is the corner radius in thousandths of a percent of the shorter side (0..50000).
export function roundRect<const A extends number>(adjust: A): Element<
    "a:prstGeom",
    readonly [readonly ["prst", "roundRect"]],
    readonly [Element<"a:avLst", Empty, readonly [Element<"a:gd", readonly [readonly ["name", "adj"], readonly ["fmla", `val ${A}`]], Empty>]>]
> {
    return prstGeom("roundRect", gd("adj", `val ${adjust}`));
}

export function noFill(): Element<"a:noFill", Empty, Empty> {
    return element("a:noFill", [], []);
}

export function pt<const X extends number, const Y extends number>(
    x: X,
    y: Y
): Element<"a:pt", readonly [readonly ["x", X], readonly ["y", Y]], Empty> {
    return element("a:pt", [["x", x], ["y", y]], []);
}

export function moveTo<const P extends CT_AdjPoint2D>(point: P): Element<"a:moveTo", Empty, readonly [P]> {
    return element("a:moveTo", [], [point]);
}

export function lnTo<const P extends CT_AdjPoint2D>(point: P): Element<"a:lnTo", Empty, readonly [P]> {
    return element("a:lnTo", [], [point]);
}

export function closePath(): Element<"a:close", Empty, Empty> {
    return element("a:close", [], []);
}

export function path2D<const W extends number, const H extends number, const C extends ReadonlyArray<CT_Path2DCommand>>(
    w: W,
    h: H,
    commands: C
): Element<"a:path", readonly [readonly ["w", W], readonly ["h", H]], C> {
    return element("a:path", [["w", w], ["h", h]], commands);
}

export function pathLst<const P extends ReadonlyArray<CT_Path2D>>(...paths: P): Element<"a:pathLst", Empty, P> {
    return element("a:pathLst", [], paths);
}

export function custGeom<const L extends CT_Path2DList>(paths: L): Element<"a:custGeom", Empty, readonly [L]> {
    return element("a:custGeom", [], [paths]);
}

export function latin<const T extends string>(typeface: T): Element<"a:latin", readonly [readonly ["typeface", T]], Empty> {
    return element("a:latin", [["typeface", typeface]], []);
}

export function highlight<const C extends CT_SRgbColor>(color: C): Element<"a:highlight", Empty, readonly [C]> {
    return element("a:highlight", [], [color]);
}

type RunChild = CT_SolidColorFillProperties | CT_Highlight | CT_TextFont;

export function rPr<const A extends ReadonlyArray<RunPropertyAttr>, const C extends ReadonlyArray<RunChild>>(
    attrs: A & AssertUniqueAttrs<A>,
    ...children: C
): Element<"a:rPr", A, C> {
    return { tag: "a:rPr", attrs, children };
}

export function pPr<const A extends ReadonlyArray<ParagraphPropertyAttr>>(attrs: A & AssertUniqueAttrs<A>): Element<"a:pPr", A, Empty> {
    return { tag: "a:pPr", attrs, children: [] };
}

export function bodyPr<const A extends ReadonlyArray<BodyPropertyAttr>>(attrs: A & AssertUniqueAttrs<A>): Element<"a:bodyPr", A, Empty> {
    return { tag: "a:bodyPr", attrs, children: [] };
}

// `value` is points in hundredths.
export function spcPts<const V extends number>(value: V): Element<"a:spcPts", readonly [readonly ["val", V]], Empty> {
    return { tag: "a:spcPts", attrs: [["val", value]], children: [] };
}

export function spcBef<const S extends CT_TextSpacingPoint | CT_TextSpacingPercent>(spacing: S): Element<"a:spcBef", Empty, readonly [S]> {
    return { tag: "a:spcBef", attrs: [], children: [spacing] };
}

export function run<const S extends string>(value: S): Element<"a:r", Empty, readonly [Element<"a:t", Empty, readonly [Text & { readonly text: S }]>]>;
export function run<const S extends string, const P extends CT_TextCharacterProperties>(
    value: S,
    properties: P
): Element<"a:r", Empty, readonly [P, Element<"a:t", Empty, readonly [Text & { readonly text: S }]>]>;
export function run(value: string, properties?: CT_TextCharacterProperties): CT_RegularTextRun {
    const body = element("a:t", [], [text(value)]);
    return properties === undefined ? element("a:r", [], [body]) : element("a:r", [], [properties, body]);
}

export function paragraph<const C extends CT_TextParagraph["children"]>(...children: C): Element<"a:p", Empty, C> {
    return element("a:p", [], children);
}

export function blip<const E extends string>(embed: E): Element<"a:blip", readonly [readonly ["r:embed", E]], Empty> {
    return element("a:blip", [["r:embed", embed]], []);
}

export function blipFill<const B extends Element<"a:blip">>(source: B): Element<"a:blipFill", Empty, readonly [B, Element<"a:stretch", Empty, readonly [Element<"a:fillRect", Empty, Empty>]>]> {
    return element("a:blipFill", [], [source, element("a:stretch", [], [element("a:fillRect", [], [])])]);
}

export function gridCol<const W extends ST_PositiveCoordinate>(width: W): Element<"a:gridCol", readonly [readonly ["w", W]], Empty> {
    return element("a:gridCol", [["w", width]], []);
}

export function tblGrid<const C extends ReadonlyArray<CT_TableCol>>(...columns: C): Element<"a:tblGrid", Empty, C> {
    return element("a:tblGrid", [], columns);
}

export function tableStyleId<const G extends string>(guid: G): Element<"a:tableStyleId", Empty, readonly [Text & { readonly text: G }]> {
    return element("a:tableStyleId", [], [text(guid)]);
}

export function tblPr<const A extends ReadonlyArray<TablePropertyAttr>>(attrs: A & AssertUniqueAttrs<A>): Element<"a:tblPr", A, Empty>;
export function tblPr<const A extends ReadonlyArray<TablePropertyAttr>, const S extends CT_TableStyleId>(attrs: A & AssertUniqueAttrs<A>, styleId: S): Element<"a:tblPr", A, readonly [S]>;
export function tblPr(attrs: ReadonlyArray<TablePropertyAttr>, styleId?: CT_TableStyleId): CT_TableProperties {
    return styleId === undefined ? { tag: "a:tblPr", attrs, children: [] } : { tag: "a:tblPr", attrs, children: [styleId] };
}

export function txBodyA<const C extends CT_TextBody["children"]>(...children: C): Element<"a:txBody", Empty, C> {
    return element("a:txBody", [], children);
}

export function tcPr<const A extends ReadonlyArray<TableCellPropertyAttr>>(attrs: A & AssertUniqueAttrs<A>): Element<"a:tcPr", A, Empty>;
export function tcPr<const A extends ReadonlyArray<TableCellPropertyAttr>, const F extends CT_SolidColorFillProperties>(attrs: A & AssertUniqueAttrs<A>, fill: F): Element<"a:tcPr", A, readonly [F]>;
export function tcPr(attrs: ReadonlyArray<TableCellPropertyAttr>, fill?: CT_SolidColorFillProperties): CT_TableCellProperties {
    return fill === undefined ? { tag: "a:tcPr", attrs, children: [] } : { tag: "a:tcPr", attrs, children: [fill] };
}

export function tc<const C extends CT_TableCell["children"]>(...children: C): Element<"a:tc", Empty, C> {
    return element("a:tc", [], children);
}

export function tr<const H extends ST_Coordinate, const C extends ReadonlyArray<CT_TableCell>>(
    height: H,
    ...cells: C
): Element<"a:tr", readonly [readonly ["h", H]], C> {
    return element("a:tr", [["h", height]], cells);
}

// A `const C` can only infer the exact child tuple (so the serialiser sees concrete children) when the
// constraint is a flat member union; the schema's ordered `Seq` constraint would widen `C` and erase that.
export function tbl<const C extends ReadonlyArray<CT_TableProperties | CT_TableGrid | CT_TableRow>>(...children: C): Element<"a:tbl", Empty, C> {
    return element("a:tbl", [], children);
}

// The child is the URI-specific payload -- a `CT_Table` for a table graphic, a `<c:chart>` reference for a chart.
export function graphicData<const U extends string, const T extends Node>(
    uri: U,
    child: T
): Element<"a:graphicData", readonly [readonly ["uri", U]], readonly [T]> {
    return element("a:graphicData", [["uri", uri]], [child]);
}

export function graphic<const D extends CT_GraphicalObjectData>(data: D): Element<"a:graphic", Empty, readonly [D]> {
    return element("a:graphic", [], [data]);
}
