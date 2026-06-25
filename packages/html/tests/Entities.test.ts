import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeEntities, escapeAttribute, escapeText } from "../src/Entities.js";

await test("decodeEntities: the five core references", () => {
    assert.equal(decodeEntities("a &amp; b &lt; c &gt; d &quot; e &apos; f"), "a & b < c > d \" e ' f");
});

await test("decodeEntities: named math and typography", () => {
    assert.equal(decodeEntities("x &ge; 1 &le; 2 &ne; 3"), "x ≥ 1 ≤ 2 ≠ 3");
    assert.equal(decodeEntities("a &mdash; b"), "a — b");
});

await test("decodeEntities: decimal and hex numeric references", () => {
    assert.equal(decodeEntities("&#65;&#x42;&#x43;"), "ABC");
});

await test("decodeEntities: an unknown or unterminated reference is left verbatim", () => {
    assert.equal(decodeEntities("R&D and AT&T"), "R&D and AT&T");
    assert.equal(decodeEntities("&notareal;"), "&notareal;");
    assert.equal(decodeEntities("&amp without semicolon"), "&amp without semicolon");
});

await test("decodeEntities: text with no ampersand is returned unchanged", () => {
    const plain = "nothing to do here";
    assert.equal(decodeEntities(plain), plain);
});

await test("escapeText: only markup-significant characters, quotes left alone", () => {
    assert.equal(escapeText("a < b > c & d \" e"), "a &lt; b &gt; c &amp; d \" e");
});

await test("escapeAttribute: also escapes the double quote", () => {
    assert.equal(escapeAttribute("a \"b\" & c"), "a &quot;b&quot; &amp; c");
});

await test("escape: a clean string is returned unchanged", () => {
    const clean = "perfectly ordinary text";
    assert.equal(escapeText(clean), clean);
});

await test("decode then escape round-trips the special characters", () => {
    assert.equal(escapeText(decodeEntities("a &lt; b")), "a &lt; b");
});
