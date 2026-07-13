import { test } from "node:test";
import assert from "node:assert/strict";
import { Namespace, xml } from "../src/oox.js";
import type { Serialize } from "../src/oox.js";
import { bodyPr, ext, off, paragraph, prstGeom, run, solidFill, srgbClr, xfrm } from "../src/drawingml/builders.js";
import { cNvPr, cSld, grpSpPr, nvGrpSpPr, nvSpPr, slide, sp, spPr, spTree, txBody } from "../src/presentationml/builders.js";
import type { CT_Slide } from "../src/typings/presentationml.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
(<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type TitleCNvPr = ReturnType<typeof cNvPr<2, "Title">>;

const deck = slide(cSld(spTree(
    nvGrpSpPr(cNvPr(1, "")),
    grpSpPr(),
    sp(
        nvSpPr(cNvPr(2, "Title")),
        spPr(xfrm(off(914400, 0), ext(2743200, 1828800)), prstGeom("rect"), solidFill(srgbClr("7BEFEB"))),
        txBody(bodyPr([]), paragraph(run("Hello")))
    )
)));

// Line continuations keep this newline-free so the one literal can drive both the runtime assertion and the
// type-level `Equal<Serialize<typeof deck>, typeof expected>` check.
const expected = `<p:sld xmlns:a="${Namespace.a}" xmlns:p="${Namespace.p}" xmlns:r="${Namespace.r}">\
<p:cSld><p:spTree>\
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>\
<p:grpSpPr/>\
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>\
<p:spPr><a:xfrm><a:off x="914400" y="0"/><a:ext cx="2743200" cy="1828800"/></a:xfrm>\
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>\
<a:solidFill><a:srgbClr val="7BEFEB"/></a:solidFill></p:spPr>\
<p:txBody><a:bodyPr/><a:p><a:r><a:t>Hello</a:t></a:r></a:p></p:txBody></p:sp>\
</p:spTree></p:cSld></p:sld>`;

export type TypeLevelChecks = [
    Expect<Equal<CT_Slide["tag"], "p:sld">>,
    Expect<Equal<Serialize<TitleCNvPr>, '<p:cNvPr id="2" name="Title"/>'>>,

    Expect<Equal<ReturnType<typeof nvSpPr<TitleCNvPr>>["children"][0], TitleCNvPr>>,

    Expect<Equal<Serialize<typeof deck>, typeof expected>>
];

await test("PresentationML: a slide serialises to its part XML", () => {
    assert.equal(xml(deck), expected);
});
