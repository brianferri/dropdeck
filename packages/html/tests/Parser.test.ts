import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/Parser.js";
import { attribute, childElements, findAll, textContent } from "../src/Query.js";
import { HtmlTag } from "../src/Specification.js";
import { firstElement } from "./utils.js";

await test("parse: nests elements and keeps text in document order", () => {
    const tree = parse("<div><p>one <em>two</em></p></div>");
    assert.equal(tree[0].tag, HtmlTag.Div);
    assert.equal(textContent(tree[0]), "one two");
    const [paragraph] = findAll(tree, "p");
    assert.equal(childElements(paragraph).map((child) => child.tag).join(","), HtmlTag.Em);
});

await test("parse: double-quoted, single-quoted, unquoted and boolean attributes", () => {
    const element = firstElement("<input name=\"a\" value='b' size=3 disabled>");
    assert.equal(attribute(element, "name"), "a");
    assert.equal(attribute(element, "value"), "b");
    assert.equal(attribute(element, "size"), "3");
    assert.equal(attribute(element, "disabled"), "");
    assert.equal(attribute(element, "missing"), null);
});

await test("parse: a void element does not swallow its following siblings", () => {
    const tree = parse("<p>before</p><br><p>after</p>");
    assert.deepEqual(findAll(tree, "p").map((p) => textContent(p)), ["before", "after"]);
    const [br] = findAll(tree, "br");
    assert.equal(br.children.length, 0);
});

await test("parse: self-closing syntax on a non-void element leaves it empty", () => {
    const tree = parse("<div/><span>x</span>");
    assert.equal(findAll(tree, "div")[0].children.length, 0);
    assert.equal(textContent(findAll(tree, "span")[0]), "x");
});

await test("parse: comments and doctypes are dropped", () => {
    const tree = parse("<!doctype html><!-- note --><p>kept</p>");
    assert.deepEqual(tree.map((node) => node.tag), [HtmlTag.P]);
});

await test("parse: raw-text script keeps angle brackets, escapable raw-text decodes entities", () => {
    const script = firstElement("<script>if (a<b && c>d) {}</script>");
    assert.equal(textContent(script), "if (a<b && c>d) {}");
    const textarea = firstElement("<textarea>a &amp; b &lt;</textarea>");
    assert.equal(textContent(textarea), "a & b <");
});

await test("parse: unclosed elements close at end of input; stray end tags are ignored", () => {
    const tree = parse("</span><div><p>hi");
    assert.equal(textContent(tree[0]), "hi");
    assert.equal(findAll(tree, "div").length, 1);
    assert.equal(findAll(tree, "p").length, 1);
});

await test("parse: a lone '<' that begins no tag is literal text", () => {
    assert.equal(textContent(parse("a < b")[0]), "a < b");
});

await test("parse: tag names are lowercased", () => {
    assert.equal(firstElement("<DIV><SPAN>x</SPAN></DIV>").tag, HtmlTag.Div);
});
