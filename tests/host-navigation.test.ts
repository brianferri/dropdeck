// @vitest-environment happy-dom
import { test, expect, beforeAll, beforeEach } from "vitest";
import { createPresenter } from "#/presenter";
import { mountNavigation } from "#/host/navigation";
import type { Presenter } from "#/presenter";

const DECK = "# One\n\nbody one\n\n---\n\n# Two\n\nbody two\n\n---\n\n# Three\n\nbody three\n";

let presenter: Presenter;
let stage: HTMLElement;

// Mount once: mountNavigation attaches document/window listeners, so re-mounting would double every handler.
beforeAll(() => {
    const deckEl = document.createElement("div");
    const dropEl = document.createElement("div");
    dropEl.id = "drop";
    for (const id of ["exportBar", "editor"]) {
        const el = document.createElement("div");
        el.id = id;
        document.body.appendChild(el);
    }
    document.body.appendChild(dropEl);
    stage = document.createElement("div");
    document.body.appendChild(stage);
    presenter = createPresenter(deckEl, dropEl);
    presenter.render(DECK, new Map());
    mountNavigation(presenter, stage, null);
});

beforeEach(() => { presenter.show(1); });

test("arrow keys step the deck, and a focused text field suppresses navigation", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(presenter.index).toBe(2);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(presenter.index).toBe(1);

    const field = document.createElement("textarea");
    document.body.appendChild(field);
    field.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(presenter.index).toBe(1);
    field.remove();
});

test("a horizontal swipe past the threshold advances or retreats", () => {
    function swipe(fromX: number, toX: number): void {
        window.dispatchEvent(Object.assign(new Event("touchstart"), { touches: [ { clientX: fromX } ] }));
        window.dispatchEvent(Object.assign(new Event("touchend"), { changedTouches: [ { clientX: toX } ] }));
    }
    swipe(300, 100);
    expect(presenter.index).toBe(2);
    swipe(100, 300);
    expect(presenter.index).toBe(1);
});

test("a click on the stage advances, but a click inside the drop UI is ignored", () => {
    stage.dispatchEvent(new MouseEvent("click", { clientX: 500, bubbles: true }));
    expect(presenter.index).toBe(2);
    const dropEl = document.getElementById("drop");
    dropEl?.dispatchEvent(new MouseEvent("click", { clientX: 500, bubbles: true }));
    expect(presenter.index).toBe(2);
});
