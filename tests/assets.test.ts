import { expect, test } from "vitest";
import { mapUrlAttrs, parse, sanitize, serializeAll } from "#/dom";
import { renderMarkdown } from "#/render/html";
import { directoryOf, isMarkdown, relativeTo } from "#/host/assets";

test("path helpers key an asset by its path relative to the deck's folder", () => {
    expect(isMarkdown("/talk/deck.md")).toBe(true);
    expect(isMarkdown("/talk/assets/logo.png")).toBe(false);
    expect(directoryOf("/talk/deck.md")).toBe("talk");
    expect(directoryOf("deck.md")).toBe("");
    expect(relativeTo("/talk/assets/logo.png", "talk")).toBe("assets/logo.png");
    expect(relativeTo("logo.png", "")).toBe("logo.png");
});

test("the asset map repoints a matching element URL by exact key and leaves everything else alone", () => {
    const assets = new Map([["assets/logo.png", "blob:test/logo"]]);
    const nodes = parse("<img src=\"assets/logo.png\"><img src=\"https://cdn.example/x.png\">");
    const html = serializeAll(mapUrlAttrs(nodes, assets));
    expect(html).toContain("src=\"blob:test/logo\"");
    expect(html).toContain("src=\"https://cdn.example/x.png\"");
});

test("a reference in an img element is rewritten, but the same text in a code sample is not", () => {
    const assets = new Map([["a.png", "blob:test/a"]]);
    const source = "![](a.png)\n\n```\n<img src=\"a.png\">\n```\n";
    const html = serializeAll(sanitize(mapUrlAttrs(parse(renderMarkdown(source)), assets)));
    expect(html).toContain("src=\"blob:test/a\"");
    expect(html).toContain("&lt;img src=\"a.png\"&gt;");
});
