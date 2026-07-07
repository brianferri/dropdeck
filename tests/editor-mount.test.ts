// @vitest-environment happy-dom
import { test, expect, beforeEach } from "vitest";
import { createPresenter } from "#/presenter";
import { mountEditor } from "#/host/editor";
import { requireElement } from "#/host/dom";

const DECK = "# One\n\nbody one\n\n---\n\n# Two\n\nbody two\n";

const IDS = [
    "editorToggle",
    "editor",
    "editorGutter",
    "editorError",
    "editorScroll",
    "editorTooltip",
    "editorPopup",
    "editorPopupList",
    "editorCompletionDoc"
] as const;

function scaffold(): { toggle: HTMLElement, panel: HTMLElement, text: HTMLTextAreaElement } {
    for (const id of IDS) {
        const el = document.createElement("div");
        el.id = id;
        document.body.appendChild(el);
    }
    const text = document.createElement("textarea");
    text.id = "editorText";
    document.body.appendChild(text);
    const highlightLayer = document.createElement("pre");
    highlightLayer.id = "editorHighlight";
    document.body.appendChild(highlightLayer);

    const panel = requireElement("editor");
    panel.classList.add("hidden");
    return { toggle: requireElement("editorToggle"), panel, text };
}

beforeEach(() => { document.body.innerHTML = ""; });

function present(deckEl: HTMLElement): ReturnType<typeof createPresenter> {
    const deck = createPresenter(deckEl, document.createElement("div"));
    deck.render(DECK, new Map());
    return deck;
}

test("the toggle opens the panel and loads the deck source into the textarea", () => {
    const { toggle, panel, text } = scaffold();
    mountEditor(present(document.createElement("div")));
    toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panel.classList.contains("hidden")).toBe(false);
    expect(text.value).toBe(DECK);
});

test("toggling a second time closes the panel", () => {
    const { toggle, panel } = scaffold();
    mountEditor(present(document.createElement("div")));
    toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panel.classList.contains("hidden")).toBe(true);
});

test("editing the textarea repaints the syntax overlay", () => {
    const { toggle, text } = scaffold();
    mountEditor(present(document.createElement("div")));
    toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    text.value = "## Heading\n";
    text.dispatchEvent(new Event("input"));
    const overlay = document.getElementById("editorHighlight");
    expect(overlay?.innerHTML).toContain("tok-heading");
});
