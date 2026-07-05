import { test } from "node:test";
import assert from "node:assert/strict";
import { Namespace, element, text, xml } from "../src/oox.js";
import { border, cellStyle, cellXf, fill, font, inlineCell, numberCell, row, sharedCell, sharedString, sheetData, sst, styleSheet, worksheet } from "../src/spreadsheetml/builders.js";
import { ST_PatternType } from "../src/spreadsheetml/Specification.js";
import type { Serialize } from "../src/oox.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
(<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

const numCell = element("c", [["r", "B2"], ["s", 1]], [element("v", [], [text("120")])]);
const numCellXml = "<c r=\"B2\" s=\"1\"><v>120</v></c>";
const stringCell = element("si", [], [element("t", [["xml:space", "preserve"]], [text("Jan")])]);
const stringCellXml = "<si><t xml:space=\"preserve\">Jan</t></si>";
const styledFont = element("font", [], [element("b", [], []), element("sz", [["val", 12]], []), element("color", [["rgb", "FF0000"]], []), element("name", [["val", "Calibri"]], [])]);
const styledFontXml = "<font><b/><sz val=\"12\"/><color rgb=\"FF0000\"/><name val=\"Calibri\"/></font>";

const solidFill = fill(ST_PatternType.Solid);
const normalStyle = cellStyle("Normal", 0, 0);
const builtNumberCell = numberCell("B2", 120);
const builtSharedCell = sharedCell("A2", 3);
const builtInlineCell = inlineCell("A1", "Hi");

export type TypeLevelChecks = [
    Expect<Equal<Serialize<typeof numCell>, typeof numCellXml>>,
    Expect<Equal<Serialize<typeof stringCell>, typeof stringCellXml>>,
    Expect<Equal<Serialize<typeof styledFont>, typeof styledFontXml>>,
    Expect<Equal<Serialize<typeof solidFill>, "<fill><patternFill patternType=\"solid\"/></fill>">>,
    Expect<Equal<Serialize<typeof normalStyle>, "<cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/>">>,
    Expect<Equal<Serialize<typeof builtNumberCell>, "<c r=\"B2\"><v>120</v></c>">>,
    Expect<Equal<Serialize<typeof builtSharedCell>, "<c r=\"A2\" t=\"s\"><v>3</v></c>">>,
    Expect<Equal<Serialize<typeof builtInlineCell>, "<c r=\"A1\" t=\"inlineStr\"><is><t xml:space=\"preserve\">Hi</t></is></c>">>
];

await test("cells serialise by type and value", () => {
    assert.equal(xml(numberCell("B2", 120)), "<c r=\"B2\"><v>120</v></c>");
    assert.equal(xml(sharedCell("A2", 3)), "<c r=\"A2\" t=\"s\"><v>3</v></c>");
    assert.equal(xml(inlineCell("A1", "Hi")), "<c r=\"A1\" t=\"inlineStr\"><is><t xml:space=\"preserve\">Hi</t></is></c>");
});

await test("shared strings serialise to the sst shape", () => {
    assert.equal(
        xml(sst([sharedString("Jan"), sharedString("Feb")])),
        `<sst xmlns="${Namespace.main}" count="2" uniqueCount="2"><si><t xml:space="preserve">Jan</t></si><si><t xml:space="preserve">Feb</t></si></sst>`
    );
});

await test("a worksheet nests its rows and cells under sheetData", () => {
    const serialized = xml(worksheet("A1:B2", sheetData([row(1, [numberCell("A1", 1), numberCell("B1", 2)])])));
    assert.match(serialized, /<dimension ref="A1:B2"\/>/);
    assert.match(serialized, /<sheetData><row r="1"><c r="A1"><v>1<\/v><\/c><c r="B1"><v>2<\/v><\/c><\/row><\/sheetData>/);
});

await test("a stylesheet gathers fonts, fills, borders and cell formats", () => {
    const styles = styleSheet({
        fonts: [font([element("sz", [["val", 11]], [])])],
        fills: [fill(ST_PatternType.Solid)],
        borders: [border()],
        cellStyleXfs: [cellXf(0, 0, 0, 0)],
        cellXfs: [cellXf(0, 0, 0, 0, 0)],
        cellStyles: [cellStyle("Normal", 0, 0)]
    });
    const serialized = xml(styles);
    assert.match(serialized, /<fonts count="1"><font><sz val="11"\/><\/font><\/fonts>/);
    assert.match(serialized, /<fills count="1"><fill><patternFill patternType="solid"\/><\/fill><\/fills>/);
    assert.match(serialized, /<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"\/><\/cellStyleXfs>/);
    assert.match(serialized, /<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"\/><\/cellXfs>/);
    assert.match(serialized, /<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"\/><\/cellStyles>/);
});
