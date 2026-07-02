import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { morphKey, resolveTransition, SlideTransition } from "#/animations/spec";
import { compile } from "#/front";
import { renderDeckHtml } from "#/export/html";
import { lowerDeck } from "#/export/pptx";

test("resolveTransition reads the front-matter, defaulting to a fade", () => {
    expect(resolveTransition({})).toBe(SlideTransition.Fade);
    expect(resolveTransition({ transition: "morph" })).toBe(SlideTransition.Morph);
    expect(resolveTransition({ transition: "none" })).toBe(SlideTransition.None);
});

test("a morph slide lowers to a morph transition keyed by content in PPTX", () => {
    const { deck } = compile(readFileSync("examples/morph/morph.md", "utf8"));

    const html = renderDeckHtml(deck, false, new Map());
    expect(html).toContain("data-transition=\"morph\"");

    const pptx = JSON.stringify(lowerDeck(deck, new Map()));
    expect(pptx).toContain("p159:morph");
    expect(pptx).toContain(`morph:${morphKey("Magic Move")}`);
});

test("transition: none lowers to a cut in PPTX, fade and morph emit a transition", () => {
    const { deck } = compile(readFileSync("examples/morph/morph.md", "utf8"));
    const slides = lowerDeck(deck, new Map());

    slides.forEach((slideInput, index) => {
        const xml = JSON.stringify(slideInput);
        const kind = resolveTransition(deck.slides[index].frontmatter);
        if (kind === SlideTransition.None) {
            expect(xml).not.toContain("p:transition");
            expect(xml).not.toContain("p159:morph");
        } else if (kind === SlideTransition.Morph)
            expect(xml).toContain("p159:morph");
        else {
            expect(xml).toContain("p:transition");
            expect(xml).not.toContain("p159:morph");
        }
    });
});
