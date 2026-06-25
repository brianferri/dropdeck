import "@tailwindcss/browser";
import { loadEmbeddedDeck, mountEditor, mountExamples, mountExportBar, mountLoader, mountNavigation, mountStage, requireElement, revealExportBar } from "#/host";
import { createPresenter } from "#/presenter";
import type { AssetMap } from "#/ir";

const stage = requireElement("stage");
const deckEl = requireElement("deck");
const dropEl = requireElement("drop");
const fileInput = requireElement<HTMLInputElement>("fileInput");
const folderInput = requireElement<HTMLInputElement>("folderInput");
const chooseButton = requireElement<HTMLButtonElement>("chooseBtn");
const chooseFolderButton = requireElement<HTMLButtonElement>("chooseFolderBtn");
const spotlight = document.querySelector<HTMLElement>(".mouse-spotlight");

const deck = createPresenter(deckEl, dropEl);

function present(source: string, assets: AssetMap): void {
    deck.render(source, assets);
    if (deck.isOpen) revealExportBar();
}

mountStage(stage);
mountNavigation(deck, stage, spotlight);
mountExportBar(deck);
mountEditor(deck);
mountExamples(present);
mountLoader(present, { dropEl, fileInput, folderInput, chooseButton, chooseFolderButton });
loadEmbeddedDeck(present);
