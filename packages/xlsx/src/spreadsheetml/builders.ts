import { element, text } from "@dropdeck/xml";
import { Namespace } from "@dropdeck/oox";
import { ST_CellType } from "./Specification.js";
import type { AttrList, Element, Empty, Node, One, Text } from "@dropdeck/xml";
import type { StyleSheetParts } from "../typings/spreadsheetml.js";
import type { ST_CellRef, ST_Index, ST_PatternType, ST_Ref } from "./Specification.js";
import type { CT_Cell, CT_Rst, CT_Row, CT_Sheet, CT_SheetData } from "./Specification.js";

const T_PRESERVE = [["xml:space", "preserve"]] as const;

type TextNode<S extends string> = Text & { readonly text: S };
type PreservedText<S extends string> = Element<"t", typeof T_PRESERVE, One<TextNode<S>>>;
type ValueCell<A extends AttrList, S extends string> = Element<"c", A, One<Element<"v", Empty, One<TextNode<S>>>>>;
type EmptyEl<T extends string> = Element<T, Empty, Empty>;

export function sharedString<const S extends string>(value: S): Element<"si", Empty, One<PreservedText<S>>> {
    return element("si", [], [element("t", T_PRESERVE, [text(value)])]);
}

type SstAttrs = readonly [readonly ["xmlns", Namespace.SpreadsheetML], readonly ["count", number], readonly ["uniqueCount", number]];
export function sst<const I extends ReadonlyArray<CT_Rst>>(items: I): Element<"sst", SstAttrs, I> {
    return element("sst", [["xmlns", Namespace.SpreadsheetML], ["count", items.length], ["uniqueCount", items.length]], items);
}

export function numberCell<const R extends ST_CellRef, const V extends number>(ref: R, value: V): ValueCell<readonly [readonly ["r", R]], `${V}`>;
export function numberCell<const R extends ST_CellRef, const V extends number, const S extends ST_Index>(
    ref: R,
    value: V,
    style: S
): ValueCell<readonly [readonly ["r", R], readonly ["s", S]], `${V}`>;
export function numberCell(ref: ST_CellRef, value: number, style?: ST_Index): ValueCell<AttrList, string> {
    const attrs = style === undefined ? [["r", ref]] as const : [["r", ref], ["s", style]] as const;
    return element("c", attrs, [element("v", [], [text(`${value}`)])]);
}

type SharedAttr = readonly ["t", ST_CellType.SharedString];
export function sharedCell<const R extends ST_CellRef, const I extends ST_Index>(ref: R, index: I): ValueCell<readonly [readonly ["r", R], SharedAttr], `${I}`>;
export function sharedCell<const R extends ST_CellRef, const I extends ST_Index, const S extends ST_Index>(
    ref: R,
    index: I,
    style: S
): ValueCell<readonly [readonly ["r", R], readonly ["s", S], SharedAttr], `${I}`>;
export function sharedCell(ref: ST_CellRef, index: ST_Index, style?: ST_Index): ValueCell<AttrList, string> {
    const attrs = style === undefined
        ? [["r", ref], ["t", ST_CellType.SharedString]] as const
        : [["r", ref], ["s", style], ["t", ST_CellType.SharedString]] as const;
    return element("c", attrs, [element("v", [], [text(`${index}`)])]);
}

type InlineAttrs<R extends ST_CellRef> = readonly [readonly ["r", R], readonly ["t", ST_CellType.InlineString]];
type InlineCell<R extends ST_CellRef, V extends string> = Element<"c", InlineAttrs<R>, One<Element<"is", Empty, One<PreservedText<V>>>>>;
export function inlineCell<const R extends ST_CellRef, const V extends string>(ref: R, value: V): InlineCell<R, V>;
export function inlineCell(ref: ST_CellRef, value: string): InlineCell<ST_CellRef, string> {
    return element("c", [["r", ref], ["t", ST_CellType.InlineString]] as const, [element("is", [], [element("t", T_PRESERVE, [text(value)])])]);
}

export function row<const I extends number, const C extends ReadonlyArray<CT_Cell>>(
    index: I,
    cells: C
): Element<"row", readonly [readonly ["r", I]], C> {
    return element("row", [["r", index]], cells);
}

export function sheetData<const R extends ReadonlyArray<CT_Row>>(rows: R): Element<"sheetData", Empty, R> {
    return element("sheetData", [], rows);
}

type WorksheetAttrs = readonly [readonly ["xmlns", Namespace.SpreadsheetML], readonly ["xmlns:r", Namespace.OfficeRelationships]];
type WorksheetChildren<D extends ST_Ref, S extends CT_SheetData> = readonly [
    Element<"dimension", readonly [readonly ["ref", D]], Empty>,
    Element<"sheetViews", Empty, One<Element<"sheetView", readonly [readonly ["workbookViewId", 0]], Empty>>>,
    S
];
export function worksheet<const D extends ST_Ref, const S extends CT_SheetData>(
    dimensionRef: D,
    data: S
): Element<"worksheet", WorksheetAttrs, WorksheetChildren<D, S>> {
    return element("worksheet", [["xmlns", Namespace.SpreadsheetML], ["xmlns:r", Namespace.OfficeRelationships]], [
        element("dimension", [["ref", dimensionRef]], []),
        element("sheetViews", [], [element("sheetView", [["workbookViewId", 0]], [])]),
        data
    ]);
}

type SheetAttrs<N extends string, I extends number, R extends string> =
    readonly [readonly ["name", N], readonly ["sheetId", I], readonly ["r:id", R]];
export function sheet<const N extends string, const I extends number, const R extends string>(
    name: N,
    sheetId: I,
    relId: R
): Element<"sheet", SheetAttrs<N, I, R>, Empty> {
    return element("sheet", [["name", name], ["sheetId", sheetId], ["r:id", relId]], []);
}

type WorkbookAttrs = readonly [readonly ["xmlns", Namespace.SpreadsheetML], readonly ["xmlns:r", Namespace.OfficeRelationships]];
type WorkbookChildren<S extends ReadonlyArray<CT_Sheet>> = readonly [
    Element<"sheets", Empty, S>,
    Element<"calcPr", readonly [readonly ["calcId", 0]], Empty>
];
export function workbook<const S extends ReadonlyArray<CT_Sheet>>(sheets: S): Element<"workbook", WorkbookAttrs, WorkbookChildren<S>> {
    return element("workbook", [["xmlns", Namespace.SpreadsheetML], ["xmlns:r", Namespace.OfficeRelationships]], [
        element("sheets", [], sheets),
        element("calcPr", [["calcId", 0]], [])
    ]);
}

export function font<const C extends ReadonlyArray<Node>>(children: C): Element<"font", Empty, C> {
    return element("font", [], children);
}

export function fill<const P extends ST_PatternType>(pattern: P): Element<"fill", Empty, One<Element<"patternFill", readonly [readonly ["patternType", P]], Empty>>> {
    return element("fill", [], [element("patternFill", [["patternType", pattern]], [])]);
}

type BorderChildren = readonly [EmptyEl<"left">, EmptyEl<"right">, EmptyEl<"top">, EmptyEl<"bottom">, EmptyEl<"diagonal">];
export function border(): Element<"border", Empty, BorderChildren> {
    return element("border", [], [element("left", [], []), element("right", [], []), element("top", [], []), element("bottom", [], []), element("diagonal", [], [])]);
}

export function numberFormat<const I extends number, const C extends string>(
    id: I,
    code: C
): Element<"numFmt", readonly [readonly ["numFmtId", I], readonly ["formatCode", C]], Empty> {
    return element("numFmt", [["numFmtId", id], ["formatCode", code]], []);
}

type XfAttrs<N extends number, F extends ST_Index, Fi extends ST_Index, B extends ST_Index> =
    readonly [readonly ["numFmtId", N], readonly ["fontId", F], readonly ["fillId", Fi], readonly ["borderId", B]];
export function cellXf<const N extends number, const F extends ST_Index, const Fi extends ST_Index, const B extends ST_Index>(
    numFmtId: N,
    fontId: F,
    fillId: Fi,
    borderId: B
): Element<"xf", XfAttrs<N, F, Fi, B>, Empty>;
export function cellXf<const N extends number, const F extends ST_Index, const Fi extends ST_Index, const B extends ST_Index, const X extends ST_Index>(
    numFmtId: N,
    fontId: F,
    fillId: Fi,
    borderId: B,
    xfId: X
): Element<"xf", readonly [...XfAttrs<N, F, Fi, B>, readonly ["xfId", X]], Empty>;
export function cellXf(numFmtId: number, fontId: ST_Index, fillId: ST_Index, borderId: ST_Index, xfId?: ST_Index): Element<"xf", AttrList, Empty> {
    const attrs = xfId === undefined
        ? [["numFmtId", numFmtId], ["fontId", fontId], ["fillId", fillId], ["borderId", borderId]] as const
        : [["numFmtId", numFmtId], ["fontId", fontId], ["fillId", fillId], ["borderId", borderId], ["xfId", xfId]] as const;
    return element("xf", attrs, []);
}

type CellStyleAttrs<N extends string, X extends ST_Index, B extends number> =
    readonly [readonly ["name", N], readonly ["xfId", X], readonly ["builtinId", B]];
export function cellStyle<const N extends string, const X extends ST_Index, const B extends number>(
    name: N,
    xfId: X,
    builtinId: B
): Element<"cellStyle", CellStyleAttrs<N, X, B>, Empty> {
    return element("cellStyle", [["name", name], ["xfId", xfId], ["builtinId", builtinId]], []);
}

type Section<T extends string, C extends ReadonlyArray<Node>> = Element<T, readonly [readonly ["count", number]], C>;
type StyleChildren<P extends StyleSheetParts> = readonly [
    Section<"fonts", P["fonts"]>,
    Section<"fills", P["fills"]>,
    Section<"borders", P["borders"]>,
    Section<"cellStyleXfs", P["cellStyleXfs"]>,
    Section<"cellXfs", P["cellXfs"]>,
    Section<"cellStyles", P["cellStyles"]>
];

export function styleSheet<const P extends StyleSheetParts>(parts: P): Element<"styleSheet", readonly [readonly ["xmlns", Namespace.SpreadsheetML]], StyleChildren<P>> {
    return element("styleSheet", [["xmlns", Namespace.SpreadsheetML]], [
        element("fonts", [["count", parts.fonts.length]], parts.fonts),
        element("fills", [["count", parts.fills.length]], parts.fills),
        element("borders", [["count", parts.borders.length]], parts.borders),
        element("cellStyleXfs", [["count", parts.cellStyleXfs.length]], parts.cellStyleXfs),
        element("cellXfs", [["count", parts.cellXfs.length]], parts.cellXfs),
        element("cellStyles", [["count", parts.cellStyles.length]], parts.cellStyles)
    ]);
}
