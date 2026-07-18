import { test } from "node:test";
import assert from "node:assert/strict";
import { xml } from "../src/index.js";
import { delimiter, frac, nthRoot, oMath, oMathPara, run, sSub, sSup, sqrt } from "../src/omml/index.js";
import type { Serialize } from "../src/index.js";
import type { Equal, Expect } from "@dropdeck/common";

const token = run("x");
const fraction = frac([run("a")], [run("b")]);
const power = sSup([run("x")], [run("2")]);
const index = sSub([run("x")], [run("i")]);
const square = sqrt([run("y")]);
const cube = nthRoot([run("3")], [run("y")]);
const fence = delimiter("(", ")", [run("a")]);
const document = oMath([fraction]);
const display = oMathPara([oMath([power])]);

const tokenMarkup = "<m:r><m:t>x</m:t></m:r>";
const fractionMarkup = "<m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f>";
const powerMarkup = "<m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup>";
const indexMarkup = "<m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub>";
const squareMarkup = "<m:rad><m:radPr><m:degHide m:val=\"1\"/></m:radPr><m:deg/><m:e><m:r><m:t>y</m:t></m:r></m:e></m:rad>";
const cubeMarkup = "<m:rad><m:deg><m:r><m:t>3</m:t></m:r></m:deg><m:e><m:r><m:t>y</m:t></m:r></m:e></m:rad>";
const fenceMarkup = "<m:d><m:dPr><m:begChr m:val=\"(\"/><m:endChr m:val=\")\"/></m:dPr><m:e><m:r><m:t>a</m:t></m:r></m:e></m:d>";
const documentMarkup = "<m:oMath xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\"><m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f></m:oMath>";
const nsAttr = "xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\"";
const displayMarkup = `<m:oMathPara ${nsAttr}><m:oMath ${nsAttr}>${powerMarkup}</m:oMath></m:oMathPara>`;

export type Assertions = [
    Expect<Equal<Serialize<typeof token>, typeof tokenMarkup>>,
    Expect<Equal<Serialize<typeof fraction>, typeof fractionMarkup>>,
    Expect<Equal<Serialize<typeof power>, typeof powerMarkup>>,
    Expect<Equal<Serialize<typeof index>, typeof indexMarkup>>,
    Expect<Equal<Serialize<typeof square>, typeof squareMarkup>>,
    Expect<Equal<Serialize<typeof cube>, typeof cubeMarkup>>,
    Expect<Equal<Serialize<typeof fence>, typeof fenceMarkup>>,
    Expect<Equal<Serialize<typeof document>, typeof documentMarkup>>,
    Expect<Equal<Serialize<typeof display>, typeof displayMarkup>>
];

await test("omml: a token is a run wrapping its text", () => {
    assert.equal(xml(token), tokenMarkup);
});

await test("omml: the two-dimensional objects nest their operands in the named slots", () => {
    assert.equal(xml(fraction), fractionMarkup);
    assert.equal(xml(power), powerMarkup);
    assert.equal(xml(index), indexMarkup);
});

await test("omml: a square root hides its degree, an nth root fills it", () => {
    assert.equal(xml(square), squareMarkup);
    assert.equal(xml(cube), cubeMarkup);
});

await test("omml: a delimiter carries its brackets in begChr/endChr", () => {
    assert.equal(xml(fence), fenceMarkup);
});

await test("omml: the oMath root serialises with its namespace", () => {
    assert.equal(xml(document), documentMarkup);
});

await test("omml: a display equation wraps its oMath in a namespaced oMathPara", () => {
    assert.equal(xml(display), displayMarkup);
});
