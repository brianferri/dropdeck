import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/Parser.js";
import { sanitize } from "../src/Sanitize.js";
import { serializeAll } from "../src/Serializer.js";

function clean(html: string): string {
    return serializeAll(sanitize(parse(html)));
}

await test("sanitize: drops script and style elements", () => {
    assert.equal(clean("<p>ok</p><script>alert(1)</script>"), "<p>ok</p>");
    assert.equal(clean("<style>body{x:url(http://e)}</style><p>ok</p>"), "<p>ok</p>");
});

await test("sanitize: drops embedding elements", () => {
    assert.equal(clean("<iframe src=\"x\"></iframe><object></object><embed><form></form>"), "");
});

await test("sanitize: strips event-handler and srcdoc attributes, keeps the element", () => {
    assert.equal(clean("<img src=\"a.png\" onerror=\"alert(1)\">"), "<img src=\"a.png\">");
    assert.equal(clean("<div onclick=\"x\" class=\"c\">t</div>"), "<div class=\"c\">t</div>");
});

await test("sanitize: drops javascript: and data:text/html URLs but keeps data:image and normal links", () => {
    assert.equal(clean("<a href=\"javascript:alert(1)\">x</a>"), "<a>x</a>");
    assert.equal(clean("<a href=\"JaVaScRiPt:alert(1)\">x</a>"), "<a>x</a>");
    assert.equal(clean("<img src=\"data:text/html,<script>1</script>\">"), "<img>");
    assert.equal(clean("<img src=\"data:image/png;base64,AAAA\">"), "<img src=\"data:image/png;base64,AAAA\">");
    assert.equal(clean("<a href=\"https://example.com\">x</a>"), "<a href=\"https://example.com\">x</a>");
});

await test("sanitize: leaves benign presentational markup untouched", () => {
    const html = "<div class=\"panel\"><h3>T</h3><p>a <strong>b</strong></p><ul><li>x</li></ul></div>";
    assert.equal(clean(html), html);
});

await test("sanitize: a scheme hidden behind control characters is still caught", () => {
    assert.equal(clean("<a href=\"java\tscript:alert(1)\">x</a>"), "<a>x</a>");
});
