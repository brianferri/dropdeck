import { HtmlTag, attribute, findAll, parse, serialize } from "@dropdeck/html";
import { renderMarkdown } from "#/render/html";
import { svgToPngDataUrl } from "#/export/rasterize";
import { BlockKind } from "#/ir";
import type { ElementNode } from "@dropdeck/html";
import type { Block, Deck } from "#/ir";

// A standalone SVG loaded as an image needs the namespace that an inline SVG in HTML is allowed to omit.
function withNamespace(markup: string): string {
    return markup.includes("xmlns") ? markup : markup.replace("<svg", "<svg xmlns=\"http://www.w3.org/2000/svg\"");
}

function svgSize(svg: ElementNode): { width: number, height: number } {
    const width = parseFloat(attribute(svg, "width") ?? "");
    const height = parseFloat(attribute(svg, "height") ?? "");
    return { width: Number.isNaN(width) ? 300 : width, height: Number.isNaN(height) ? 300 : height };
}

function blockSvgs(block: Block): Array<ElementNode> {
    if (block.kind === BlockKind.Prose) return findAll(parse(renderMarkdown(block.markdown)), HtmlTag.Svg);
    if (block.kind === BlockKind.Html) return findAll(parse(renderMarkdown(block.markup)), HtmlTag.Svg);
    if (block.kind === BlockKind.Columns) {
        const out: Array<ElementNode> = [];
        for (const column of block.columns) for (const nested of column) for (const svg of blockSvgs(nested)) out.push(svg);
        return out;
    }
    return [];
}

// PowerPoint cannot embed SVG, so every inline SVG is rasterised to a PNG up front (async) and looked up by its
// serialized markup during the synchronous slide lowering. Rendered at 2x the placed size for a crisp result.
export async function rasterizeDeckSvgs(deck: Deck): Promise<Map<string, string>> {
    const unique = new Map<string, ElementNode>();
    for (const slide of deck.slides) {
        for (const block of slide.blocks) {
            for (const svg of blockSvgs(block)) {
                const markup = serialize(svg);
                if (!unique.has(markup)) unique.set(markup, svg);
            }
        }
    }
    const pngs = new Map<string, string>();
    await Promise.all(Array.from(unique).map(async ([markup, svg]) => {
        try {
            const size = svgSize(svg);
            pngs.set(markup, await svgToPngDataUrl(withNamespace(markup), size.width * 2, size.height * 2));
        } catch {
            // A malformed SVG cannot rasterise; it is dropped from the PPTX rather than failing the whole export.
        }
    }));
    return pngs;
}
