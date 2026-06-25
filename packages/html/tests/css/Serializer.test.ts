import { test } from "node:test";
import assert from "node:assert/strict";
import { atRule, declaration, rule } from "../../src/css/builders.js";
import { parse, parseStyle } from "../../src/css/Parser.js";
import { serialize, serializeStyle } from "../../src/css/Serializer.js";

await test("serializeStyle: a built declaration list round-trips", () => {
    const decls = [declaration("color", "red"), declaration("font-size", "2rem")];
    assert.equal(serializeStyle(decls), "color: red; font-size: 2rem");
});

await test("serialize: a built rule round-trips", () => {
    const sheet = [rule([".a", ".b"], [declaration("color", "red")])];
    assert.equal(serialize(sheet), ".a, .b { color: red }");
});

await test("serialize: a built at-rule round-trips", () => {
    const sheet = [atRule("@media", "screen", [rule([".a"], [declaration("color", "red")])])];
    assert.equal(serialize(sheet), "@media screen { .a { color: red } }");
});

await test("round-trip: parse then serialize is stable", () => {
    const css = ".a { color: red; padding: 1rem }";
    assert.equal(serialize(parse(css)), css);
});

await test("round-trip: an inline style with !important is stable", () => {
    const style = "color: red; width: 100% !important";
    assert.equal(serializeStyle(parseStyle(style)), style);
});
