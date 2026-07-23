import { test } from "node:test";
import assert from "node:assert/strict";
import { xml } from "@dropdeck/xml";
import { barChart, barSeries, categories, chart, chartSpace, externalData, numbers, numRef, plotArea, seriesName, strRef, categoryAxis, valueAxis } from "../src/drawingml/chart/builders.js";
import { cNvPr, cSld, chartFrame, grpSpPr, nvGrpSpPr, slide, spTree } from "../src/presentationml/builders.js";
import { toParts } from "../src/document/assemble.js";
import { PartKind, pack } from "@dropdeck/oox";
import type { Part } from "@dropdeck/oox";

const space = chartSpace(
    chart(plotArea(
        barChart([barSeries(0, seriesName(strRef("Sheet1!$B$1", ["Signups"])), categories(strRef("Sheet1!$A$2:$A$3", ["Jan", "Feb"])), numbers(numRef("Sheet1!$B$2:$B$3", [120, 180], "General")))], 1, 2),
        categoryAxis(1, 2),
        valueAxis(2, 1)
    )),
    externalData("rId1")
);

const deckSlide = {
    slide: slide(cSld(spTree(nvGrpSpPr(cNvPr(1, "")), grpSpPr(), chartFrame(2, "Chart 1", 0, 0, 5486400, 3200400, "rId2")))),
    media: [],
    charts: [ { relationshipId: "rId2", chart: space, workbook: new Uint8Array([0x50, 0x4b, 0x03, 0x04]) } ]
};

function partAt(parts: ReadonlyArray<Part>, path: string): Part {
    const found = parts.find((part) => part.path === path);
    if (found === undefined) throw new Error(`no part at ${path}`);
    return found;
}

await test("chart part: the slide rel, chart part, chart rels and embedded workbook are all emitted", () => {
    const parts = toParts([deckSlide]);

    const slideRels = partAt(parts, "ppt/slides/_rels/slide1.xml.rels");
    assert.equal(slideRels.kind, PartKind.Xml);
    assert.match(xml(slideRels.root), /<Relationship Id="rId2" Type="[^"]*\/chart" Target="\.\.\/charts\/chart1\.xml"\/>/);

    const chartPart = partAt(parts, "ppt/charts/chart1.xml");
    assert.equal(chartPart.kind, PartKind.Xml);
    assert.match(xml(chartPart.root), /^<c:chartSpace .*<c:barChart>/);

    const chartRels = partAt(parts, "ppt/charts/_rels/chart1.xml.rels");
    assert.equal(chartRels.kind, PartKind.Xml);
    assert.match(xml(chartRels.root), /<Relationship Id="rId1" Type="[^"]*\/package" Target="\.\.\/embeddings\/Microsoft_Excel_Sheet1\.xlsx"\/>/);

    const workbook = partAt(parts, "ppt/embeddings/Microsoft_Excel_Sheet1.xlsx");
    assert.equal(workbook.kind, PartKind.Bytes);
    assert.deepEqual(Array.from(workbook.data.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
});

await test("chart part: [Content_Types].xml declares the chart override and the xlsx default", async () => {
    const zip = await pack(toParts([deckSlide]));
    // The first local file header is [Content_Types].xml; Node's deflate-raw rejects trailing bytes, so slice
    // the exact compressed range: header (30) + filename + extra fields, spanning the header's compressed size.
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const compressedSize = view.getUint32(18, true);
    const dataStart = 30 + view.getUint16(26, true) + view.getUint16(28, true);
    const stream = new Blob([zip.slice(dataStart, dataStart + compressedSize) as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const text = new TextDecoder().decode(new Uint8Array(await new Response(stream).arrayBuffer()));
    assert.match(text, /<Override PartName="\/ppt\/charts\/chart1\.xml" ContentType="[^"]*drawingml\.chart\+xml"\/>/);
    assert.match(text, /<Default Extension="xlsx" ContentType="[^"]*spreadsheetml\.sheet"\/>/);
});
