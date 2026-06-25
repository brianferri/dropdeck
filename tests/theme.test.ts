import { expect, test } from "vitest";
import { renderDeckHtml } from "#/export/html";
import { compile } from "#/front";
import { slideStyle } from "#/theme";
import type { Declaration } from "@dropdeck/html/css";

function valueOf(declarations: ReadonlyArray<Declaration>, property: string): string | null {
    const found = declarations.find((declaration) => declaration.property === property);
    return found ? found.value : null;
}

test("slideStyle emits nothing when the slide overrides nothing themeable", () => {
    expect(slideStyle({ accent: "#000000" }, {})).toEqual([]);
    expect(slideStyle({ accent: "#000000" }, { layout: "center" })).toEqual([]);
});

test("slideStyle emits only the variables the slide changes", () => {
    const declarations = slideStyle({ accent: "#000000" }, { accent: "#ffffff" });
    expect(valueOf(declarations, "--color-accent-1")).toBe("#ffffff");
    expect(valueOf(declarations, "--accent1-rgb")).toBe("255,255,255");
    expect(valueOf(declarations, "--color-bg")).toBeNull();
    expect(valueOf(declarations, "background")).toBeNull();
});

test("slideStyle paints the slide background only when the slide changes it", () => {
    const declarations = slideStyle({}, { bg: "#101010" });
    expect(valueOf(declarations, "--color-bg")).toBe("#101010");
    expect(valueOf(declarations, "background")).toBe("#101010");
});

test("a per-slide frontmatter themes only its own slide in the rendered deck", () => {
    const source = "---\naccent: \"#111111\"\n---\n\n# One\n\n---\naccent: \"#abcdef\"\n---\n\n# Two";
    const { deck } = compile(source);
    const html = renderDeckHtml(deck, false, new Map());
    // The second slide's accent override is baked into its style; the deck-level accent is applied to :root at
    // runtime by applyConfig, so it never appears in the static render.
    expect(html).toContain("#abcdef");
    expect(html).toContain("--color-accent-1");
    expect(html).not.toContain("#111111");
});
