import { relationship, relationships } from "../package/builders.js";
import { ContentType, RelationshipType } from "../package/constants.js";
import { pack, xmlPart } from "../package/parts.js";
import { border, cellStyle, cellXf, fill, font, inlineCell, numberCell, row, sharedCell, sharedString, sheet, sheetData, sst, styleSheet, workbook, worksheet } from "../spreadsheetml/builders.js";
import { element } from "../oox.js";
import { ST_FontScheme, ST_PatternType } from "../spreadsheetml/Specification.js";
import type { CT_Cell, CT_Font, CT_Rst, CT_Stylesheet, CT_Worksheet, ST_CellRef, ST_Ref } from "../spreadsheetml/Specification.js";
import type { CT_Relationship } from "../package/Specification.js";
import type { Part } from "../package/parts.js";

const RELS = ContentType.Relationships;

export type CellValue = string | number | boolean;
export type Sheet = { readonly name: string, readonly rows: ReadonlyArray<ReadonlyArray<CellValue>> };

function columnName(index: number): string {
    let name = "";
    let n = index;
    while (n >= 0) {
        name = String.fromCharCode(65 + (n % 26)) + name;
        n = Math.floor(n / 26) - 1;
    }
    return name;
}

function cellRef(column: number, rowIndex: number): ST_CellRef {
    return `${columnName(column)}${rowIndex + 1}` as ST_CellRef;
}

// `values` holds the strings in first-seen order; that order is the index each shared-string cell stores.
type StringTable = { readonly values: Array<string>, readonly intern: (value: string) => number };

function stringTable(): StringTable {
    const indexByValue = new Map<string, number>();
    const values: Array<string> = [];
    return {
        values,
        intern(value) {
            const existing = indexByValue.get(value);
            if (existing !== undefined) return existing;
            const index = values.length;
            indexByValue.set(value, index);
            values.push(value);
            return index;
        }
    };
}

function cellFor(value: CellValue, ref: ST_CellRef, strings: StringTable): CT_Cell {
    if (typeof value === "number") return numberCell(ref, value);
    if (typeof value === "boolean") return inlineCell(ref, value ? "TRUE" : "FALSE");
    return sharedCell(ref, strings.intern(value));
}

function sheetXml(input: Sheet, strings: StringTable): CT_Worksheet {
    const rows = input.rows.map((cells, rowIndex) => row(rowIndex + 1, cells.map((value, column) => cellFor(value, cellRef(column, rowIndex), strings))));
    const columns = input.rows.reduce((widest, cells) => Math.max(widest, cells.length), 0);
    const height = input.rows.length;
    const dimension = (height === 0 || columns === 0 ? "A1" : `A1:${cellRef(columns - 1, height - 1)}`) as ST_Ref;
    return worksheet(dimension, sheetData(rows));
}

function defaultFont(): CT_Font {
    return font([
        element("sz", [["val", 11]], []),
        element("color", [["theme", 1]], []),
        element("name", [["val", "Calibri"]], []),
        element("family", [["val", 2]], []),
        element("scheme", [["val", ST_FontScheme.Minor]], [])
    ]);
}

// Excel reserves fills 0 and 1 (none, gray125) and expects the "Normal" cell style even when nothing is formatted;
// omitting either makes it repair the file on open.
function defaultStyles(): CT_Stylesheet {
    return styleSheet({
        fonts: [defaultFont()],
        fills: [fill(ST_PatternType.None), fill(ST_PatternType.Gray125)],
        borders: [border()],
        cellStyleXfs: [cellXf(0, 0, 0, 0)],
        cellXfs: [cellXf(0, 0, 0, 0, 0)],
        cellStyles: [cellStyle("Normal", 0, 0)]
    });
}

export function workbookParts(sheets: ReadonlyArray<Sheet>): Array<Part> {
    const strings = stringTable();
    const worksheets = sheets.map((input) => sheetXml(input, strings));
    const sheetEntries = sheets.map((input, index) => sheet(input.name, index + 1, `rId${index + 1}`));

    const parts: Array<Part> = [];
    parts.push(xmlPart("_rels/.rels", RELS, relationships([relationship("rId1", RelationshipType.OfficeDocument, "xl/workbook.xml")])));
    parts.push(xmlPart("xl/workbook.xml", ContentType.Workbook, workbook(sheetEntries)));

    const workbookRels: Array<CT_Relationship> = worksheets.map((_, index) => relationship(`rId${index + 1}`, RelationshipType.Worksheet, `worksheets/sheet${index + 1}.xml`));
    workbookRels.push(relationship(`rId${worksheets.length + 1}`, RelationshipType.Styles, "styles.xml"));
    workbookRels.push(relationship(`rId${worksheets.length + 2}`, RelationshipType.SharedStrings, "sharedStrings.xml"));
    parts.push(xmlPart("xl/_rels/workbook.xml.rels", RELS, relationships(workbookRels)));

    worksheets.forEach((sheetPart, index) => parts.push(xmlPart(`xl/worksheets/sheet${index + 1}.xml`, ContentType.Worksheet, sheetPart)));
    parts.push(xmlPart("xl/styles.xml", ContentType.Styles, defaultStyles()));

    const stringItems: ReadonlyArray<CT_Rst> = strings.values.map(sharedString);
    parts.push(xmlPart("xl/sharedStrings.xml", ContentType.SharedStrings, sst(stringItems)));

    return parts;
}

export async function workbookBytes(sheets: ReadonlyArray<Sheet>): Promise<Uint8Array> {
    return pack(workbookParts(sheets));
}
