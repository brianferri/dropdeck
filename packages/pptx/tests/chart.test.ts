import { test } from "node:test";
import assert from "node:assert/strict";
import { xml } from "@dropdeck/xml";
import { Namespace } from "@dropdeck/oox";
import {
    barChart,
    barSeries,
    categories,
    categoryAxis,
    chart,
    chartRef,
    chartSpace,
    cval,
    externalData,
    numbers,
    numRef,
    plotArea,
    seriesName,
    strRef,
    valueAxis
} from "../src/drawingml/chart/builders.js";
import { ST_BarDir } from "../src/drawingml/chart/Specification.js";
import type { Serialize } from "@dropdeck/xml";
import type { Equal, Expect } from "@dropdeck/common";

// A leaf builder keeps its literal `val` and `local` through to the serializer -- narrow, not `<c:barDir val="${string}">`.
const barDirNode = cval("barDir", ST_BarDir.Col);
const axIdNode = cval("axId", 111111111);

export type TypeLevelChecks = [
    Expect<Equal<Serialize<typeof barDirNode>, "<c:barDir val=\"col\"/>">>,
    Expect<Equal<Serialize<typeof axIdNode>, "<c:axId val=\"111111111\"/>">>
];

const name = seriesName(strRef("Sheet1!$B$1", ["Signups"]));
const cats = categories(strRef("Sheet1!$A$2:$A$4", ["Jan", "Feb", "Mar"]));
const vals = numbers(numRef("Sheet1!$B$2:$B$4", [120, 180, 240], "General"));
const space = chartSpace(
    chart(plotArea(barChart([barSeries(0, name, cats, vals)], 111111111, 222222222), categoryAxis(111111111, 222222222), valueAxis(222222222, 111111111))),
    externalData("rId3")
);

await test("chart: chartSpace declares the chart namespaces and wraps a bar chart", () => {
    const out = xml(space);
    assert.match(out, new RegExp(`^<c:chartSpace xmlns:c="${Namespace.Chart}" xmlns:a="${Namespace.DrawingML}" xmlns:r="${Namespace.OfficeRelationships}">`));
    assert.match(out, /<c:barChart><c:barDir val="col"\/><c:grouping val="clustered"\/>/);
    assert.match(out, /<c:autoTitleDeleted val="true"\/>.*<c:plotVisOnly val="true"\/>/);
    assert.match(out, /<c:externalData r:id="rId3"><c:autoUpdate val="false"\/><\/c:externalData>/);
});

await test("chart: a series carries its name, categories and values with cached data + formulas", () => {
    const out = xml(space);
    assert.match(out, /<c:ser><c:idx val="0"\/><c:order val="0"\/>/);
    assert.match(out, /<c:tx><c:strRef><c:f>Sheet1!\$B\$1<\/c:f><c:strCache><c:ptCount val="1"\/><c:pt idx="0"><c:v>Signups<\/c:v>/);
    assert.match(out, /<c:cat><c:strRef><c:f>Sheet1!\$A\$2:\$A\$4<\/c:f>.*<c:v>Jan<\/c:v>.*<c:v>Mar<\/c:v>/);
    assert.match(out, /<c:val><c:numRef><c:f>Sheet1!\$B\$2:\$B\$4<\/c:f><c:numCache><c:formatCode>General<\/c:formatCode><c:ptCount val="3"\/><c:pt idx="0"><c:v>120<\/c:v>/);
});

await test("chart: the two axes cross-reference each other by id", () => {
    const out = xml(space);
    assert.match(out, /<c:catAx><c:axId val="111111111"\/><c:scaling><c:orientation val="minMax"\/><\/c:scaling><c:delete val="false"\/><c:axPos val="b"\/><c:crossAx val="222222222"\/><\/c:catAx>/);
    assert.match(out, /<c:valAx><c:axId val="222222222"\/>.*<c:axPos val="l"\/><c:crossAx val="111111111"\/><\/c:valAx>/);
});

await test("chart: the graphicData reference points at the chart part", () => {
    assert.equal(xml(chartRef("rId2")), `<c:chart xmlns:c="${Namespace.Chart}" xmlns:r="${Namespace.OfficeRelationships}" r:id="rId2"/>`);
});
