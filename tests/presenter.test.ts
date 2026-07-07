// @vitest-environment happy-dom
import { test, expect } from "vitest";
import { createPresenter } from "#/presenter";

const DECK = "# One\n\nbody one\n\n---\n\n# Two\n\nbody two\n\n---\n\n# Three\n\nbody three\n";

function presenter(): ReturnType<typeof createPresenter> {
    return createPresenter(document.createElement("div"), document.createElement("div"));
}

test("render loads the deck, hides the dropzone, and starts on the first slide", () => {
    const p = presenter();
    p.render(DECK, new Map());
    expect(p.index).toBe(1);
    expect(p.title).toBe("One");
    expect(p.deck.slides.length).toBe(3);
    expect(p.isOpen).toBe(true);
    expect(p.element.innerHTML).toContain("slide");
});

test("change steps through slides and wraps at the ends", () => {
    const p = presenter();
    p.render(DECK, new Map());
    p.change(1);
    expect(p.index).toBe(2);
    p.change(1);
    expect(p.index).toBe(3);
    p.change(1); // past the end wraps to the first
    expect(p.index).toBe(1);
    p.change(-1); // before the start wraps to the last
    expect(p.index).toBe(3);
});

test("show clamps an out-of-range slide into the deck", () => {
    const p = presenter();
    p.render(DECK, new Map());
    p.show(99);
    expect(p.index).toBe(3);
    p.show(-5);
    expect(p.index).toBe(1);
});

test("update re-renders a new source without error", () => {
    const p = presenter();
    p.render(DECK, new Map());
    const error = p.update("# Solo\n\njust one\n");
    expect(error).toBe(null);
    expect(p.deck.slides.length).toBe(1);
    expect(p.title).toBe("Solo");
});
