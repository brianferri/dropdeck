import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, serialize } from "../src/index.js";
import type { Notation, Parse, Serialize } from "../src/index.js";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type Checks = [
    Assert<Equal<Serialize<Parse<"x^2">>, "x^{2}">>,
    Assert<Equal<Serialize<Parse<"a+b">>, "a + b">>,
    Assert<Equal<Serialize<Parse<"a+b\\cdot c">>, "a + b \\cdot c">>,
    Assert<Equal<Serialize<Parse<"\\frac{a}{b}">>, "\\frac{a}{b}">>,
    Assert<Equal<Serialize<Parse<"\\sqrt{x}">>, "\\sqrt{x}">>,
    Assert<Equal<Serialize<Parse<"\\sqrt[3]{x}">>, "\\sqrt[3]{x}">>,
    Assert<Equal<Serialize<Parse<"(a+b)">>, "(a + b)">>,
    Assert<Equal<Serialize<Parse<"{a+b}^2">>, "{a + b}^{2}">>,
    Assert<Equal<Serialize<Parse<"a_i^2">>, "a_{i}^{2}">>
];

function roundTrip<Source extends string>(source: Source): Serialize<Parse<Source> & Notation> {
    return serialize(parse(source) as Parse<Source> & Notation);
}

await test("serialize emits canonical LaTeX", () => {
    assert.equal(roundTrip("x^2"), "x^{2}");
    assert.equal(roundTrip("a+b"), "a + b");
    assert.equal(roundTrip("\\frac{a}{b}"), "\\frac{a}{b}");
    assert.equal(roundTrip("\\sqrt[3]{x}"), "\\sqrt[3]{x}");
    assert.equal(roundTrip("(a+b)"), "(a + b)");
});

await test("serialize braces a row base under a script", () => {
    assert.equal(roundTrip("{a+b}^2"), "{a + b}^{2}");
});

await test("parse and serialize round-trip at the IR level", () => {
    assert.deepEqual(parse(serialize(parse("x^2"))), parse("x^2"));
    assert.deepEqual(parse(serialize(parse("a+b\\cdot c"))), parse("a+b\\cdot c"));
    assert.deepEqual(parse(serialize(parse("\\frac{a_i}{2}"))), parse("\\frac{a_i}{2}"));
    assert.deepEqual(parse(serialize(parse("\\sqrt[3]{x}+1"))), parse("\\sqrt[3]{x}+1"));
    assert.deepEqual(parse(serialize(parse("(a+b)^2"))), parse("(a+b)^2"));
});
