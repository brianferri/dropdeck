import { test } from "node:test";
import assert from "node:assert/strict";
import {
    fenced, fraction, identifier, LatexError, number, operator, parse, radical, root, row, subscript, superscript
} from "../src/index.js";

await test("parses atoms", () => {
    assert.deepEqual(parse("x"), identifier("x"));
    assert.deepEqual(parse("42"), number(42));
    assert.deepEqual(parse("\\alpha"), identifier("\\alpha"));
});

await test("keeps infix operators in a flat row", () => {
    assert.deepEqual(
        parse("a+b\\cdot c"),
        row([identifier("a"), operator("+"), identifier("b"), operator("\\cdot"), identifier("c")])
    );
    assert.deepEqual(parse("xy"), row([identifier("x"), identifier("y")]));
});

await test("wraps the preceding atom in scripts, stacking left to right", () => {
    assert.deepEqual(parse("x^2"), superscript(identifier("x"), number(2)));
    assert.deepEqual(parse("x_i"), subscript(identifier("x"), identifier("i")));
    assert.deepEqual(parse("a_i^2"), superscript(subscript(identifier("a"), identifier("i")), number(2)));
});

await test("parses the two-dimensional commands", () => {
    assert.deepEqual(parse("\\frac{a}{b}"), fraction(identifier("a"), identifier("b")));
    assert.deepEqual(parse("\\sqrt{x}"), radical(identifier("x")));
    assert.deepEqual(parse("\\sqrt[3]{x}"), root(identifier("x"), number(3)));
});

await test("parses fenced groups", () => {
    assert.deepEqual(
        parse("(a+b)"),
        fenced("(", ")", [row([identifier("a"), operator("+"), identifier("b")])])
    );
});

await test("throws on malformed input", () => {
    assert.throws(() => parse("(a"), LatexError);
    assert.throws(() => parse("\\frac{a}"), LatexError);
    assert.throws(() => parse("a @ b"), LatexError);
    assert.throws(() => parse("\\"), LatexError);
});
