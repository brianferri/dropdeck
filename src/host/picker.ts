import { div, mapUrlAttrs, serialize } from "#/dom";
import { compile } from "#/front";
import { finalizeSlides } from "#/export";
import { slideNodes } from "#/export/html";
import { pickerCss, pickerView } from "#/host/components/picker.component";
import { mountStyle } from "#/host/dom";
import { applyTheme } from "#/theme";
import type { DomNode } from "#/dom";
import type { AssetMap } from "#/ir";
import type { DeckConfig } from "#/config";

export type DeckChoice = {
    name: string,
    source: string,
    assets: AssetMap
};

type Refs = {
    cards: ReadonlyArray<HTMLElement>,
    decks: ReadonlyArray<HTMLElement>,
    counter: HTMLElement
};

type State = {
    deck: number,
    slide: number
};

const DECK_WIDTH = 1180;

function need(root: ParentNode, selector: string): HTMLElement {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`picker: missing ${selector}`);
    return element;
}

function deckPreview(choice: DeckChoice): { node: DomNode, config: DeckConfig } {
    const { deck } = compile(choice.source);
    const slides = deck.slides.map((slide, index) => div({ class: "slide" }, slideNodes(slide, index, deck.slides.length, false)));
    const [node] = mapUrlAttrs([div({ class: "deck picker-deck" }, slides)], choice.assets);
    return { node, config: deck.config };
}

function apply(refs: Refs, state: State): void {
    refs.cards.forEach((card, index) => card.classList.toggle("selected", index === state.deck));
    refs.decks.forEach((deck, index) => deck.classList.toggle("shown", index === state.deck));
    const slides = Array.from(refs.decks[state.deck].querySelectorAll<HTMLElement>(".slide"));
    slides.forEach((slide, index) => slide.classList.toggle("active", index === state.slide));
    refs.counter.textContent = `${state.slide + 1} / ${slides.length}`;
}

export async function pickDeck(choices: ReadonlyArray<DeckChoice>): Promise<DeckChoice | null> {
    return new Promise((resolve) => {
        mountStyle("dropdeck-picker", pickerCss);
        const previews = choices.map(deckPreview);
        const view = pickerView(choices.map((choice) => choice.name), previews.map((preview) => preview.node));
        document.body.insertAdjacentHTML("beforeend", serialize(view));
        const overlay = document.body.lastElementChild as HTMLElement;
        const refs: Refs = {
            cards: Array.from(overlay.querySelectorAll<HTMLElement>(".picker-card")),
            decks: Array.from(overlay.querySelectorAll<HTMLElement>(".picker-deck")),
            counter: need(overlay, ".picker-counter")
        };
        // No live presenter drives the preview, so reveal each deck's entrance-animated elements up front.
        refs.decks.forEach((deck, index) => {
            applyTheme(deck, previews[index].config);
            finalizeSlides(deck);
        });

        const stage = need(overlay, ".picker-stage");
        const state: State = { deck: 0, slide: 0 };

        function fit(): void {
            overlay.style.setProperty("--preview-scale", String(stage.clientWidth / DECK_WIDTH));
        }

        function move(direction: number): void {
            const count = refs.decks[state.deck].querySelectorAll(".slide").length;
            state.slide = (state.slide + direction + count) % count;
            apply(refs, state);
        }

        function finish(result: DeckChoice | null): void {
            window.removeEventListener("resize", fit);
            document.removeEventListener("keydown", onKey);
            overlay.remove();
            resolve(result);
        }

        function onKey(event: KeyboardEvent): void {
            if (event.key === "Escape") finish(null);
            if (event.key === "ArrowLeft") move(-1);
            if (event.key === "ArrowRight") move(1);
        }

        refs.cards.forEach((card, index) => {
            card.addEventListener("click", () => {
                state.deck = index;
                state.slide = 0;
                apply(refs, state);
            });
        });
        need(overlay, ".picker-arrow.prev").addEventListener("click", () => { move(-1); });
        need(overlay, ".picker-arrow.next").addEventListener("click", () => { move(1); });
        need(overlay, ".picker-present").addEventListener("click", () => { finish(choices[state.deck]); });
        // The present click would otherwise bubble into the revealed deck's navigation and advance a slide.
        overlay.addEventListener("click", (event) => {
            event.stopPropagation();
            if (event.target === overlay) finish(null);
        });
        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", fit);

        fit();
        apply(refs, state);
    });
}
