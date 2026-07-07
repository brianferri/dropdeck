// @vitest-environment happy-dom
import { test, expect, beforeEach } from "vitest";
import { loadEmbeddedDeck, mountLoader } from "#/host/loader";
import { toBase64 } from "#/export/assets";
import type { AssetMap } from "#/ir";

beforeEach(() => { document.body.innerHTML = ""; });

test("loadEmbeddedDeck decodes the inlined source and presents it with no sidecars", () => {
    const source = "# Embedded\n\nbody\n";
    const holder = document.createElement("script");
    holder.id = "deck-source";
    holder.textContent = toBase64(source);
    document.body.appendChild(holder);

    let seenSource: string | null = null;
    let seenAssetCount = -1;
    function present(loaded: string, assets: AssetMap): void {
        seenSource = loaded;
        seenAssetCount = assets.size;
    }
    loadEmbeddedDeck(present);
    expect(seenSource).toBe(source);
    expect(seenAssetCount).toBe(0);
});

test("loadEmbeddedDeck does nothing when no embedded deck is present", () => {
    let called = false;
    loadEmbeddedDeck(() => { called = true; });
    expect(called).toBe(false);
});

function make<T extends HTMLElement>(tag: string): T {
    return document.createElement(tag) as T;
}

function targets(): Parameters<typeof mountLoader>[1] {
    const dropEl = document.createElement("div");
    document.body.appendChild(dropEl);
    return {
        dropEl,
        fileInput: make<HTMLInputElement>("input"),
        folderInput: make<HTMLInputElement>("input"),
        chooseButton: make<HTMLButtonElement>("button"),
        chooseFolderButton: make<HTMLButtonElement>("button")
    };
}

test("the drop zone marks itself while dragging and clears the mark on drop", () => {
    const wired = targets();
    mountLoader(() => undefined, wired);
    wired.dropEl.dispatchEvent(new Event("dragenter"));
    expect(wired.dropEl.classList.contains("dragging")).toBe(true);
    wired.dropEl.dispatchEvent(new Event("drop"));
    expect(wired.dropEl.classList.contains("dragging")).toBe(false);
});

test("the choose button forwards its click to the hidden file input", () => {
    const wired = targets();
    mountLoader(() => undefined, wired);
    let opened = false;
    wired.fileInput.addEventListener("click", () => { opened = true; });
    wired.chooseButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(opened).toBe(true);
});
