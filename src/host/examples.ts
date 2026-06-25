import { basenameOf, directoryOf, relativeTo } from "#/host/assets";
import { pickDeck } from "#/host/picker";
import type { AssetMap } from "#/ir";
import type { DeckChoice } from "#/host/picker";
import type { Present } from "#/host/loader";

// Every example deck and its sibling images are bundled at build time, so the offline single-file app
// previews them through the same picker the choose-folder flow uses, with no network.
const sourceModules = import.meta.glob<string>("../../examples/**/*.md", { query: "?raw", import: "default", eager: true });
const assetModules = import.meta.glob<string>("../../examples/**/*.{png,jpg,jpeg,gif,svg,webp}", { import: "default", eager: true });

const ROOT = "examples/";

function shortKey(path: string): string {
    const at = path.indexOf(ROOT);
    return at < 0 ? path : path.slice(at + ROOT.length);
}

function nameOf(key: string): string {
    const base = basenameOf(key);
    const dot = base.lastIndexOf(".");
    return dot < 0 ? base : base.slice(0, dot);
}

function assetsUnder(directory: string): AssetMap {
    const prefix = directory === "" ? "" : `${directory}/`;
    const assets = new Map<string, string>();
    for (const path of Object.keys(assetModules)) {
        const key = shortKey(path);
        if (!key.startsWith(prefix)) continue;
        assets.set(relativeTo(key, directory), assetModules[path]);
    }
    return assets;
}

function exampleOf(path: string): DeckChoice {
    const key = shortKey(path);
    return { name: nameOf(key), source: sourceModules[path], assets: assetsUnder(directoryOf(key)) };
}

const EXAMPLES: ReadonlyArray<DeckChoice> = Object.keys(sourceModules)
    .map(exampleOf)
    .sort((a, b) => a.name.localeCompare(b.name));

export function mountExamples(present: Present): void {
    const button = document.getElementById("examplesBtn");
    if (!button) return;
    if (EXAMPLES.length === 0) {
        button.hidden = true;
        return;
    }
    button.addEventListener("click", () => {
        pickDeck(EXAMPLES).then((chosen) => { if (chosen) present(chosen.source, chosen.assets); }).catch(() => undefined);
    });
}
