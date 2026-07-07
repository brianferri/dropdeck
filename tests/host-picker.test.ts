// @vitest-environment happy-dom
import { test, expect, beforeEach } from "vitest";
import { pickDeck } from "#/host/picker";
import type { DeckChoice } from "#/host/picker";

const CHOICES: ReadonlyArray<DeckChoice> = [
    { name: "A", source: "# A1\n\nx\n\n---\n\n# A2\n\ny\n", assets: new Map() },
    { name: "B", source: "# B1\n\nz\n", assets: new Map() }
];

beforeEach(() => { document.body.innerHTML = ""; });

function overlay(): HTMLElement {
    return document.body.lastElementChild as HTMLElement;
}

function click(root: ParentNode, selector: string): void {
    root.querySelector(selector)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

test("the present button resolves with the selected deck", async () => {
    const pending = pickDeck(CHOICES);
    click(overlay(), ".picker-present");
    const result = await pending;
    expect(result?.name).toBe("A");
});

test("Escape dismisses the picker with no choice", async () => {
    const pending = pickDeck(CHOICES);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(await pending).toBe(null);
});

test("the next arrow steps through the selected deck's slides", async () => {
    const pending = pickDeck(CHOICES);
    const counter = overlay().querySelector(".picker-counter");
    expect(counter?.textContent).toBe("1 / 2");
    click(overlay(), ".picker-arrow.next");
    expect(counter?.textContent).toBe("2 / 2");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await pending;
});

test("clicking a deck card selects it and resets to its first slide", async () => {
    const pending = pickDeck(CHOICES);
    const cards = overlay().querySelectorAll(".picker-card");
    cards[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(overlay().querySelector(".picker-counter")?.textContent).toBe("1 / 1");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await pending;
});
