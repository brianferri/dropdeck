import { div, mapUrlAttrs, serializeAll } from "#/dom";
import { slideNodes } from "#/export/html/slides";
import { slideStyle } from "#/theme";
import type { DomNode } from "#/dom";
import type { AssetMap, Deck } from "#/ir";

export function deckSlideNodes(deck: Deck, particlesOn: boolean): Array<DomNode> {
    const total = deck.slides.length;
    return deck.slides.map((slide, index) => div(
        {
            class: index === 0 ? "slide active" : "slide",
            data: { slide: String(index + 1) },
            style: slideStyle(deck.config, slide.frontmatter)
        },
        slideNodes(slide, index, total, particlesOn)
    ));
}

export function renderDeckHtml(deck: Deck, particlesOn: boolean, assets: AssetMap): string {
    return serializeAll(mapUrlAttrs(deckSlideNodes(deck, particlesOn), assets));
}
