import { expect, test } from "vitest";
import { renderMarkdown } from "#/render/html";

test("headings render at their level", () => {
    expect(renderMarkdown("# Title")).toBe("<h1>Title</h1>");
    expect(renderMarkdown("## Sub")).toBe("<h2>Sub</h2>");
});

test("inline emphasis, strong, and code wrap their text", () => {
    expect(renderMarkdown("**b** and _i_ and `c`")).toBe("<p><strong>b</strong> and <em>i</em> and <code>c</code></p>");
});

test("links and images carry their destination", () => {
    expect(renderMarkdown("[t](u)")).toBe("<p><a href=\"u\">t</a></p>");
    expect(renderMarkdown("![alt](pic.png)")).toBe("<p><img src=\"pic.png\" alt=\"alt\"></p>");
});

test("a tight list drops the paragraph wrapper", () => {
    expect(renderMarkdown("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
});

test("fenced code escapes its body and keeps the language class", () => {
    expect(renderMarkdown("```js\nx < 2\n```")).toBe("<pre><code class=\"language-js\">x &lt; 2</code></pre>");
});

test("plain text is HTML-escaped", () => {
    expect(renderMarkdown("a < b & c")).toBe("<p>a &lt; b &amp; c</p>");
});
