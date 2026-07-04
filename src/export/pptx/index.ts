import { toBytes } from "@dropdeck/pptx";
import { lowerSlide } from "#/export/pptx/slide";
import { rasterizeDeckSvgs } from "#/export/pptx/svg";
import { resolvePalette } from "#/export/pptx/palette";
import { collectAssetDataUrls, downloadBytes, slugify } from "#/export/assets";
import type { SlideInput } from "@dropdeck/pptx";
import type { AssetMap, Deck } from "#/ir";
import type { ExportContext } from "#/export/context";

const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export function lowerDeck(deck: Deck, assets: AssetMap, svgPngs = new Map<string, string>()): Array<SlideInput> {
    const palette = resolvePalette(deck.config);
    return deck.slides.map((slideEl, index) => lowerSlide(slideEl, index, deck.slides.length, palette, assets, svgPngs));
}

export async function exportPptx(context: ExportContext): Promise<void> {
    const assets = await collectAssetDataUrls(context.deckEl, context.assets);
    const svgPngs = await rasterizeDeckSvgs(context.deck);
    const bytes = await toBytes(lowerDeck(context.deck, assets, svgPngs));
    downloadBytes(bytes, `${slugify(context.title)}.pptx`, PPTX_MIME);
}
