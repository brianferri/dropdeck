import { test } from "node:test";
import assert from "node:assert/strict";
import { text, xml } from "../src/index.js";
import { MATHML_NS, math, mfrac, mi, mn, mo, mroot, mrow, msqrt, msub, msup } from "../src/mathml/index.js";
import type { Serialize } from "../src/index.js";
import type { Equal, Expect } from "@dropdeck/common";

const frac = mfrac([], mi([], text("a")), mi([], text("b")));
const power = msup([], mi([], text("x")), mn([], text("2")));
const index = msub([], mi([], text("x")), mi([], text("i")));
const square = msqrt([], mi([], text("y")));
const cube = mroot([], mi([], text("y")), mn([], text("3")));
const relation = mrow([], mi([], text("a")), mo([], text("<")), mi([], text("b")));
const fence = mrow([], mo([["stretchy", true]], text("(")), mi([], text("a")), mo([["stretchy", true]], text(")")));
const document = math([["xmlns", MATHML_NS]], frac);

const fracMarkup = "<mfrac><mi>a</mi><mi>b</mi></mfrac>";
const powerMarkup = "<msup><mi>x</mi><mn>2</mn></msup>";
const indexMarkup = "<msub><mi>x</mi><mi>i</mi></msub>";
const squareMarkup = "<msqrt><mi>y</mi></msqrt>";
const cubeMarkup = "<mroot><mi>y</mi><mn>3</mn></mroot>";
const relationMarkup = "<mrow><mi>a</mi><mo>&lt;</mo><mi>b</mi></mrow>";
const fenceMarkup = "<mrow><mo stretchy=\"true\">(</mo><mi>a</mi><mo stretchy=\"true\">)</mo></mrow>";
const documentMarkup = "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>";

export type Assertions = [
    Expect<Equal<Serialize<typeof frac>, typeof fracMarkup>>,
    Expect<Equal<Serialize<typeof power>, typeof powerMarkup>>,
    Expect<Equal<Serialize<typeof index>, typeof indexMarkup>>,
    Expect<Equal<Serialize<typeof square>, typeof squareMarkup>>,
    Expect<Equal<Serialize<typeof cube>, typeof cubeMarkup>>,
    Expect<Equal<Serialize<typeof relation>, typeof relationMarkup>>,
    Expect<Equal<Serialize<typeof fence>, typeof fenceMarkup>>,
    Expect<Equal<Serialize<typeof document>, typeof documentMarkup>>
];

await test("mathml: the two-dimensional layout elements serialise their operands in order", () => {
    assert.equal(xml(frac), fracMarkup);
    assert.equal(xml(power), powerMarkup);
    assert.equal(xml(index), indexMarkup);
});

await test("mathml: a radical is msqrt with a bare radicand and mroot with an index", () => {
    assert.equal(xml(square), squareMarkup);
    assert.equal(xml(cube), cubeMarkup);
});

await test("mathml: a `<` operator glyph is escaped in the mo text, not emitted as markup", () => {
    assert.equal(xml(relation), relationMarkup);
});

await test("mathml: an mo carries presentation attributes and a boolean coerces to a string", () => {
    assert.equal(xml(fence), fenceMarkup);
});

await test("mathml: the math root serialises with its namespace", () => {
    assert.equal(xml(document), documentMarkup);
});
