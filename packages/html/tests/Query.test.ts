import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/Parser.js";
import { attribute, childElements, findAll, findFirst, hasClass, textContent } from "../src/Query.js";
import { HtmlTag } from "../src/Specification.js";
import { firstByTag } from "./utils.js";

await test("attribute: returns the value or null", () => {
    const element = firstByTag("<div id=\"x\" data-k=\"v\"></div>", "div");
    assert.equal(attribute(element, "id"), "x");
    assert.equal(attribute(element, "data-k"), "v");
    assert.equal(attribute(element, "class"), null);
});

await test("hasClass: matches a whole token, not a substring", () => {
    const element = firstByTag("<div class=\"grid grid-cols-4 gap-3\"></div>", "div");
    assert.equal(hasClass(element, "grid"), true);
    assert.equal(hasClass(element, "grid-cols-4"), true);
    assert.equal(hasClass(element, "gap-3"), true);
    assert.equal(hasClass(element, "cols"), false);
    assert.equal(hasClass(element, "g"), false);
});

await test("childElements: skips text nodes, keeps direct element children only", () => {
    const element = firstByTag("<div>text<span>a</span> more <b>b</b><p><i>deep</i></p></div>", "div");
    assert.deepEqual(childElements(element).map((child) => child.tag), [HtmlTag.Span, HtmlTag.B, HtmlTag.P]);
});

await test("textContent: concatenates a whole subtree in order", () => {
    assert.equal(textContent(firstByTag("<div>a <b>b <i>c</i></b> d</div>", "div")), "a b c d");
});

await test("findAll: every matching descendant in document order, including nested ones", () => {
    const tree = parse("<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul>");
    // The outer "b" item's text includes its nested list, and the nested item is still visited in order.
    assert.deepEqual(findAll(tree, "li").map((li) => textContent(li)), ["a", "bc", "c"]);
});

await test("findFirst: the first matching descendant, or null", () => {
    const root = firstByTag("<div><header></header><section><h2>title</h2></section></div>", "div");
    assert.equal(findFirst(root, "h2")?.tag, HtmlTag.H2);
    assert.equal(findFirst(root, "table"), null);
});
