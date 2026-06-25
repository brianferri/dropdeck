import { DiagnosticSeverity, compile } from "#/front";
import { fromBase64, readBlob } from "#/export";
import { basenameOf, directoryOf, gatherDropFiles, isMarkdown, pickerFiles, relativeTo } from "#/host/assets";
import { pickDeck } from "#/host/picker";
import type { AssetMap } from "#/ir";
import type { PathFile } from "#/host/assets";
import type { DeckChoice } from "#/host/picker";

export type Present = (source: string, assets: AssetMap) => void;

type Load = (entries: ReadonlyArray<PathFile>) => void;

type LoaderTargets = {
    dropEl: HTMLElement,
    fileInput: HTMLInputElement,
    folderInput: HTMLInputElement,
    chooseButton: HTMLButtonElement,
    chooseFolderButton: HTMLButtonElement
};

function unreadableAlert(): void {
    window.alert("Those files could not be read.");
}

function isCompatible(source: string): boolean {
    return !compile(source).diagnostics.some((diagnostic) => diagnostic.severity === DiagnosticSeverity.Error);
}

function assetMap(
    files: ReadonlyArray<PathFile>,
    urls: ReadonlyArray<string>,
    directory: string
): Map<string, string> {
    const map = new Map<string, string>();
    files.forEach((file, index) => map.set(relativeTo(file.path, directory), urls[index]));
    return map;
}

// Keys each blob URL relative to a deck's own folder, so two decks in the same drop reference shared files by
// their own relative paths.
async function buildChoices(entries: ReadonlyArray<PathFile>): Promise<{ choices: Array<DeckChoice>, urls: Array<string> }> {
    const markdown = entries.filter((entry) => isMarkdown(entry.path));
    const files = entries.filter((entry) => !isMarkdown(entry.path));
    const sources = await Promise.all(markdown.map(async (entry) => readBlob(entry.file, "text")));
    const urls = files.map((file) => URL.createObjectURL(file.file));
    const choices = markdown
        .map((entry, index) => ({
            entry,
            source: sources[index]
        }))
        .filter((deck) => isCompatible(deck.source))
        .map((deck) => ({
            name: basenameOf(deck.entry.path),
            source: deck.source,
            assets: assetMap(files, urls, directoryOf(deck.entry.path))
        }));
    return { choices, urls };
}

async function choose(choices: ReadonlyArray<DeckChoice>): Promise<DeckChoice | null> {
    if (choices.length === 0) {
        window.alert("Drop a Markdown (.md) file, or a folder that contains one.");
        return null;
    }
    if (choices.length === 1) return choices[0];
    return pickDeck(choices);
}

// Free the previous drop's blob URLs only when the next deck loads, so the showing deck's <img>s stay valid
// until then.
function deckLoader(present: Present): Load {
    let revoke: (() => void) | undefined;

    async function load(entries: ReadonlyArray<PathFile>): Promise<void> {
        revoke?.();
        const { choices, urls } = await buildChoices(entries);
        revoke = (): void => { for (const url of urls) URL.revokeObjectURL(url); };
        const chosen = await choose(choices);
        if (chosen) present(chosen.source, chosen.assets);
    }

    return (entries) => { load(entries).catch(unreadableAlert); };
}

export function mountLoader(present: Present, targets: LoaderTargets): void {
    const load = deckLoader(present);
    mountFilePicker(targets.chooseButton, targets.fileInput, load);
    mountFilePicker(targets.chooseFolderButton, targets.folderInput, load);
    mountDropZone(targets.dropEl, load);
}

function mountFilePicker(button: HTMLButtonElement, input: HTMLInputElement, load: Load): void {
    button.addEventListener("click", () => { input.click(); });
    input.addEventListener("change", () => {
        const { files } = input;
        if (files && files.length > 0) load(pickerFiles(files));
    });
}

function mountDropZone(dropEl: HTMLElement, load: Load): void {
    function drag(event: DragEvent): void {
        event.preventDefault();
        dropEl.classList.add("dragging");
    }
    dropEl.addEventListener("dragenter", drag);
    dropEl.addEventListener("dragover", drag);
    dropEl.addEventListener("dragleave", (event) => {
        if (event.target === dropEl) dropEl.classList.remove("dragging");
    });
    dropEl.addEventListener("drop", (event) => {
        event.preventDefault();
        dropEl.classList.remove("dragging");
        if (event.dataTransfer) gatherDropFiles(event.dataTransfer).then(load).catch(unreadableAlert);
    });
    // A drop anywhere else must not let the browser navigate away to the dropped file.
    window.addEventListener("dragover", (event) => { event.preventDefault(); });
    window.addEventListener("drop", (event) => { event.preventDefault(); });
}

export function loadEmbeddedDeck(present: Present): void {
    const embedded = document.getElementById("deck-source")?.textContent.trim();
    // An exported deck carries its images inline already, so it presents with no sidecar map.
    if (embedded) present(fromBase64(embedded), new Map());
}
