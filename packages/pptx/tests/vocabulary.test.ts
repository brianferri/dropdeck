import { test } from "node:test";
import assert from "node:assert/strict";
import { xml } from "../src/oox.js";
import type { Serialize } from "../src/oox.js";
import { bodyPr, ext, gridCol, latin, off, paragraph, prstGeom, roundRect, rPr, run, solidFill, srgbClr, tbl, tblGrid, tc, tr, txBodyA, xfrm } from "../src/drawingml/builders.js";
import { cNvPr, fade, nvPicPr, pic, picBlipFill, spPr, transition, wipe } from "../src/presentationml/builders.js";
import { ST_TransitionSideDirectionType, ST_TransitionSpeed } from "../src/presentationml/Specification.js";
import type { Equal, Expect } from "@dropdeck/common";

const accent = "7BEFEB";
const colWidth = 4000000;
const speed = ST_TransitionSpeed.Medium;

const styledRun = run("code", rPr([["sz", 1800], ["b", true]], solidFill(srgbClr(accent)), latin("Aptos")));
const styledRunXml = `<a:r><a:rPr sz="1800" b="true"><a:solidFill><a:srgbClr val="${accent}"/></a:solidFill><a:latin typeface="Aptos"/></a:rPr><a:t>code</a:t></a:r>`;

const corner = roundRect(8000);
const cornerXml = "<a:prstGeom prst=\"roundRect\"><a:avLst><a:gd name=\"adj\" fmla=\"val 8000\"/></a:avLst></a:prstGeom>";

const table = tbl(
    tblGrid(gridCol(colWidth), gridCol(colWidth)),
    tr(370000, tc(txBodyA(bodyPr([]), paragraph(run("A")))), tc(txBodyA(bodyPr([]), paragraph(run("B")))))
);
const tableXml = `<a:tbl><a:tblGrid><a:gridCol w="${colWidth}"/><a:gridCol w="4000000"/></a:tblGrid>\
<a:tr h="370000">\
<a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>A</a:t></a:r></a:p></a:txBody></a:tc>\
<a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>B</a:t></a:r></a:p></a:txBody></a:tc>\
</a:tr></a:tbl>`;

const slideFade = transition(fade(), speed);
const slideFadeXml = `<p:transition spd="${speed}"><p:fade/></p:transition>`;

const logoEmbed = "rId2";
const logo = pic(nvPicPr(cNvPr(2, "Logo")), picBlipFill(logoEmbed), spPr(xfrm(off(100, 200), ext(300, 400)), prstGeom("rect")));
const logoXml = `<p:pic><p:nvPicPr><p:cNvPr id="2" name="Logo"/>\
<p:cNvPicPr><a:picLocks noChangeAspect="true"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>\
<p:blipFill><a:blip r:embed="${logoEmbed}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>\
<p:spPr><a:xfrm><a:off x="100" y="200"/><a:ext cx="300" cy="400"/></a:xfrm>\
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;

// Each built node narrows to its exact element type, so the serializer's output is verified at the type level
// against the same literal the runtime assertion uses.
export type TypeLevelChecks = [
    Expect<Equal<Serialize<typeof styledRun>, typeof styledRunXml>>,
    Expect<Equal<Serialize<typeof corner>, typeof cornerXml>>,
    Expect<Equal<Serialize<typeof table>, typeof tableXml>>,
    Expect<Equal<Serialize<typeof slideFade>, typeof slideFadeXml>>,
    Expect<Equal<Serialize<typeof logo>, typeof logoXml>>
];

await test("drawingml: a styled run, rounded geometry, and a table serialise to their XML", () => {
    assert.equal(xml(styledRun), styledRunXml);
    assert.equal(xml(corner), cornerXml);
    assert.equal(xml(table), tableXml);
});

await test("presentationml: transitions and a picture serialise to their XML", () => {
    assert.equal(xml(slideFade), slideFadeXml);
    assert.equal(xml(transition(wipe(ST_TransitionSideDirectionType.Left))), '<p:transition><p:wipe dir="l"/></p:transition>');
    assert.equal(xml(logo), logoXml);
});
