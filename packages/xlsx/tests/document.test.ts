import { test } from "node:test";
import assert from "node:assert/strict";
import { workbookBytes, workbookParts } from "../src/document/assemble.js";
import type { Sheet } from "../src/document/assemble.js";

const sample: ReadonlyArray<Sheet> = [ { name: "Data", rows: [["", "Signups"], ["Jan", 120], ["Feb", 180]] } ];

await test("document: workbookParts includes the minimum part set a workbook requires", () => {
    const paths = workbookParts(sample).map((part) => part.path);
    const required = [
        "_rels/.rels",
        "xl/workbook.xml",
        "xl/_rels/workbook.xml.rels",
        "xl/worksheets/sheet1.xml",
        "xl/styles.xml",
        "xl/sharedStrings.xml"
    ];
    for (const path of required) assert.ok(paths.includes(path), `missing ${path}`);
});

await test("document: a second sheet adds its own worksheet part", () => {
    const paths = workbookParts([ { name: "A", rows: [[1]] }, { name: "B", rows: [[2]] } ]).map((part) => part.path);
    assert.ok(paths.includes("xl/worksheets/sheet1.xml"));
    assert.ok(paths.includes("xl/worksheets/sheet2.xml"));
});

await test("document: workbookBytes produces a ZIP", async () => {
    const zip = await workbookBytes(sample);
    assert.deepEqual(Array.from(zip.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
});
