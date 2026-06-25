import type { AssetMap, Deck } from "#/ir";

// `deckEl` is the live element so an offline export can inline what the browser already fetched.
export type ExportContext = {
    deck: Deck,
    deckEl: HTMLElement,
    source: string,
    title: string,
    assets: AssetMap
};
