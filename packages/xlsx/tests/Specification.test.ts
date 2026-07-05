import { test } from "node:test";
import assert from "node:assert/strict";
import { Namespace } from "../src/oox.js";
import type { CT_Cell, CT_Sst, CT_Stylesheet, CT_Table, CT_Workbook, CT_Worksheet, ST_CellRef, ST_Guid, ST_Ref } from "../src/spreadsheetml/Specification.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
(<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type IsCellRef<S extends string> = S extends ST_CellRef ? true : false;
type IsRef<S extends string> = S extends ST_Ref ? true : false;
type GuidAccepted<S extends string> = ST_Guid<S> extends S ? true : false;

export type TypeLevelChecks = [
    Expect<Equal<IsCellRef<"A1">, true>>,
    Expect<Equal<IsCellRef<"B2">, true>>,
    Expect<Equal<IsCellRef<"AB12">, true>>,
    Expect<Equal<IsCellRef<"1A">, false>>,
    Expect<Equal<IsCellRef<"A">, false>>,
    Expect<Equal<IsCellRef<"12">, false>>,
    Expect<Equal<IsCellRef<"A1:C4">, false>>,
    Expect<Equal<IsRef<"A1:C4">, true>>,
    Expect<Equal<IsRef<"A1">, true>>,
    Expect<Equal<IsRef<"A1:">, false>>,

    Expect<Equal<GuidAccepted<"{5940675A-B579-460E-94D1-54222C63F5DA}">, true>>,
    Expect<Equal<GuidAccepted<"{5940675-B579-460E-94D1-54222C63F5DA}">, false>>,
    Expect<Equal<GuidAccepted<"{5940675AA-B579-460E-94D1-54222C63F5DA}">, false>>,
    Expect<Equal<GuidAccepted<"{5940675A-B579-460E-94D1-54222C63F5DAA}">, false>>,
    Expect<Equal<GuidAccepted<"{ZZZZZZZZ-B579-460E-94D1-54222C63F5DA}">, false>>,
    Expect<Equal<GuidAccepted<"hello">, false>>,

    Expect<Equal<CT_Cell["tag"], "c">>,
    Expect<Equal<CT_Workbook["tag"], "workbook">>,
    Expect<Equal<CT_Worksheet["tag"], "worksheet">>,
    Expect<Equal<CT_Stylesheet["tag"], "styleSheet">>,
    Expect<Equal<CT_Sst["tag"], "sst">>,
    Expect<Equal<CT_Table["tag"], "table">>
];

await test("Specification: the SpreadsheetML and relationship namespaces", () => {
    assert.equal(Namespace.main, "http://schemas.openxmlformats.org/spreadsheetml/2006/main");
    assert.equal(Namespace.r, "http://schemas.openxmlformats.org/officeDocument/2006/relationships");
});
