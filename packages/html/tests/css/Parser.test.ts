import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, parseStyle } from "../../src/css/Parser.js";
import { atRules, declarationValue, descriptorValue, rules, rulesFor, styleValue } from "../../src/css/Query.js";
import { serialize } from "../../src/css/Serializer.js";

await test("parse: an unquoted url() keeps its data: URI whole, semicolons and all", () => {
    const css = "@font-face{font-family:'M';src:url(data:font/woff2;base64,AA+/=) format('woff2');unicode-range:U+0-FF}";
    const [face] = atRules(parse(css));
    assert.equal(face.name, "@font-face");
    assert.equal(descriptorValue(face, "src"), "url(data:font/woff2;base64,AA+/=) format('woff2')");
    assert.equal(descriptorValue(face, "font-family"), "'M'");
    assert.equal(descriptorValue(face, "unicode-range"), "U+0-FF");
});

await test("serialize: an @font-face with a data: url round-trips its src faithfully", () => {
    const css = "@font-face{src:url(data:font/woff2;base64,AA+/=) format('woff2')}";
    assert.ok(serialize(parse(css)).includes("url(data:font/woff2;base64,AA+/=) format('woff2')"));
});

await test("parse: a quoted url(\"...\") stays an ident plus a string, not a url token", () => {
    const decls = parseStyle("background: url(\"a;b.png\")");
    assert.equal(decls[0].value, "url(\"a;b.png\")");
});

await test("parseStyle: a declaration list with units and !important", () => {
    const decls = parseStyle("color: red; font-size: 2rem; width: 100% !important");
    assert.equal(decls.length, 3);
    assert.deepEqual([decls[0].property, decls[0].value, decls[0].important], ["color", "red", false]);
    assert.deepEqual([decls[1].property, decls[1].value], ["font-size", "2rem"]);
    assert.deepEqual([decls[2].property, decls[2].value, decls[2].important], ["width", "100%", true]);
});

await test("parseStyle: a trailing fragment without a colon is dropped", () => {
    const decls = parseStyle("color: red; bogus");
    assert.equal(decls.length, 1);
    assert.equal(decls[0].property, "color");
});

await test("parse: a rule with multiple selectors and declarations", () => {
    const sheet = parse(".a, .b > span { color: red; padding: 1rem }");
    const r = rules(sheet);
    assert.equal(r.length, 1);
    assert.deepEqual(r[0].selectors, [".a", ".b > span"]);
    assert.equal(declarationValue(r[0], "color"), "red");
    assert.equal(declarationValue(r[0], "padding"), "1rem");
    assert.equal(declarationValue(r[0], "margin"), null);
});

await test("parse: an at-rule keeps its name, prelude and nested body", () => {
    const sheet = parse("@media (min-width: 100px) { .a { color: red } }");
    const at = atRules(sheet);
    assert.equal(at.length, 1);
    assert.equal(at[0].name, "@media");
    assert.equal(at[0].prelude, "(min-width: 100px)");
    assert.notEqual(at[0].body, null);
});

await test("parse: a statement at-rule has a null body", () => {
    const sheet = parse("@import \"reset.css\";");
    const at = atRules(sheet);
    assert.equal(at[0].name, "@import");
    assert.equal(at[0].body, null);
});

await test("parse: comments are skipped, in the sheet and inside a value", () => {
    const sheet = parse("/* lead */ .a { color: /* mid */ red }");
    assert.equal(rules(sheet).length, 1);
    assert.equal(declarationValue(rules(sheet)[0], "color"), "red");
});

await test("query: rulesFor finds by selector and the last declaration wins", () => {
    const sheet = parse(".a { color: red } .b { color: blue }");
    assert.equal(rulesFor(sheet, ".b").length, 1);
    assert.equal(rulesFor(sheet, ".missing").length, 0);
    assert.equal(styleValue(parseStyle("margin: 0; margin: 4px"), "margin"), "4px");
});
