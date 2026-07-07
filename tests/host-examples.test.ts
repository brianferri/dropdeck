// @vitest-environment happy-dom
import { test, expect, beforeEach } from "vitest";
import { mountExamples } from "#/host/examples";

beforeEach(() => { document.body.innerHTML = ""; });

function ignore(): void {
    // These tests exercise the button wiring, not the deck-present callback.
}

test("the examples button stays visible when bundled decks exist", () => {
    const button = document.createElement("button");
    button.id = "examplesBtn";
    document.body.appendChild(button);
    mountExamples(ignore);
    // The repo bundles example decks, so the glob is non-empty and the button is not hidden away.
    expect(button.hidden).toBe(false);
});

test("mountExamples is inert when the button is absent", () => {
    expect(() => { mountExamples(ignore); }).not.toThrow();
});

test("clicking the button opens the deck picker", () => {
    const button = document.createElement("button");
    button.id = "examplesBtn";
    document.body.appendChild(button);
    mountExamples(ignore);
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(document.querySelector(".picker-stage")).not.toBe(null);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
});
