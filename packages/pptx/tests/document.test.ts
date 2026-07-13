import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyPr, ext, off, paragraph, prstGeom, run, solidFill, srgbClr, xfrm } from "../src/drawingml/builders.js";
import { cNvPr, cSld, grpSpPr, nvGrpSpPr, nvSpPr, slide, sp, spPr, spTree, txBody } from "../src/presentationml/builders.js";
import { toBytes, toParts } from "../src/document/assemble.js";
import type { CT_Slide } from "../src/typings/presentationml.js";

function sampleSlide(): CT_Slide {
    return slide(cSld(spTree(
        nvGrpSpPr(cNvPr(1, "")),
        grpSpPr(),
        sp(
            nvSpPr(cNvPr(2, "Title")),
            spPr(xfrm(off(914400, 457200), ext(10515600, 1325563)), prstGeom("rect"), solidFill(srgbClr("7BEFEB"))),
            txBody(bodyPr([]), paragraph(run("Hello deck")))
        )
    )));
}

await test("document: toParts includes the minimum part set a presentation requires", () => {
    const paths = toParts([sampleSlide()]).map((part) => part.path);
    const required = [
        "_rels/.rels",
        "ppt/presentation.xml",
        "ppt/_rels/presentation.xml.rels",
        "ppt/presProps.xml",
        "ppt/theme/theme1.xml",
        "ppt/slideMasters/slideMaster1.xml",
        "ppt/slideMasters/_rels/slideMaster1.xml.rels",
        "ppt/slideLayouts/slideLayout1.xml",
        "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
        "ppt/slides/slide1.xml",
        "ppt/slides/_rels/slide1.xml.rels"
    ];
    for (const path of required) assert.ok(paths.includes(path), `missing ${path}`);
});

await test("document: toBytes produces a ZIP", async () => {
    const zip = await toBytes([sampleSlide()]);
    assert.deepEqual(Array.from(zip.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
});
