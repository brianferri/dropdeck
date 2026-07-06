import { test } from "node:test";
import assert from "node:assert/strict";
import { element, text } from "../src/builders.js";
import { parse } from "../src/Parser.js";
import { serialize, serializeAll } from "../src/Serializer.js";
import { HtmlTag, NodeField } from "../src/Specification.js";

await test("builders: element and text produce the structural node shapes", () => {
    const node = element("p", [["class", "lead"]], [text("hi")]);
    assert.ok(NodeField.Tag in node);
    assert.equal(node.tag, "p");
    assert.deepEqual(node.attrs, [["class", "lead"]]);
    assert.ok(NodeField.Text in node.children[0]);
});

await test("serialize: element with attributes, escaping text and attribute values", () => {
    const node = element("a", [["href", "?x=1&y=2"], ["title", "a \"q\""]], [text("1 < 2")]);
    assert.equal(serialize(node), "<a href=\"?x=1&amp;y=2\" title=\"a &quot;q&quot;\">1 &lt; 2</a>");
});

await test("serialize: a void element emits no closing tag", () => {
    assert.equal(serialize(element(HtmlTag.Br, [], [])), "<br>");
    assert.equal(serialize(element(HtmlTag.Img, [["src", "/a.png"]], [])), "<img src=\"/a.png\">");
});

await test("serialize: a valueless attribute renders as a bare name", () => {
    assert.equal(serialize(element(HtmlTag.Input, [["disabled", ""]], [])), "<input disabled>");
});

await test("parse then serializeAll is stable for representative markup", () => {
    const html = "<div class=\"box\"><p>a <strong>b</strong> &amp; <code>c</code></p><ul><li>x</li></ul><br></div>";
    assert.equal(serializeAll(parse(html)), html);
});

await test("serialize: raw-text script/style keep their content verbatim", () => {
    assert.equal(serialize(element(HtmlTag.Script, [], [text("if (a < b && c > d) {}")])), "<script>if (a < b && c > d) {}</script>");
    assert.equal(serialize(element(HtmlTag.Style, [], [text(".x::before{content:'>'}")])), "<style>.x::before{content:'>'}</style>");
});

await test("serialize: escapable raw-text title still escapes its text", () => {
    assert.equal(serialize(element(HtmlTag.Title, [], [text("a < b")])), "<title>a &lt; b</title>");
});

await test("parse then serializeAll is stable for a document with script and style", () => {
    const html = "<style>.x{color:#fff}</style><script>for (i=0;i<3;i++){}</script>";
    assert.equal(serializeAll(parse(html)), html);
});
