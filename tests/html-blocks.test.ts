import { test, expect } from "vitest";
import { renderBlock } from "#/export/html";
import { serialize } from "#/dom";
import { BlockKind } from "#/ir";
import type { Block } from "#/ir";

function render(block: Block): string {
    return serialize(renderBlock(block));
}

test("metrics render a counter for numeric values and plain text otherwise", () => {
    const out = render({ kind: BlockKind.Metrics, rows: [ { value: "42", label: "Answer", sub: "x" }, { value: "N/A", label: "Other", sub: "y" } ] });
    expect(out).toContain("grid-cols-2");
    expect(out).toContain("<span data-count=\"42\" data-animation=\"counter\">0</span>");
    expect(out).toContain(">N/A<");
    expect(out).toContain("data-animation=\"reveal\"");
});

test("bars render a track and a data-driven fill tagged for the bars animation", () => {
    const out = render({ kind: BlockKind.Bars, rows: [ { label: "Alpha", tag: "95%", percent: 95 } ] });
    expect(out).toContain("bar-fill");
    expect(out).toContain("data-width=\"95\"");
    expect(out).toContain("data-animation=\"bars\"");
    expect(out).toContain("Alpha");
});

test("cards render one reveal panel per card with a heading and body", () => {
    const out = render({ kind: BlockKind.Cards, cards: [ { title: "T", body: "body text" } ] });
    expect(out).toContain("grid-cols-1");
    expect(out).toContain("<h3>T</h3>");
    expect(out).toContain("<p>body text</p>");
});

test("code blocks HTML-escape their body", () => {
    const out = render({ kind: BlockKind.Code, lang: "ts", content: "const x = 1 < 2;" });
    expect(out).toContain("code-block");
    expect(out).toContain("const x = 1 &lt; 2;");
});
