import { canvas, div, h1, h2, p, parse, span } from "#/dom";
import { renderBlocks } from "#/export/html/blocks";
import { morphKey } from "#/animations/spec";
import { RICH, isProse, paragraphsOf, proseText, resolveLayout } from "#/layout";
import { SlideLayout } from "#/ir";
import type { DomNode, ElementNode } from "#/dom";
import type { Slide } from "#/ir";

function titleRule(title: string): ElementNode<"span"> {
    return span({ class: "title-rule", data: { morph: `${morphKey(title)}-rule`, animation: "reveal" } });
}

// Parsed from a literal so the hand-tuned inline blob geometry serializes back verbatim.
const MESH_NODES = parse("<div class=\"gradient-mesh\">"
    + "<div class=\"blob\" style=\"width:430px;height:430px;top:-120px;right:-120px;background:var(--color-accent-2);opacity:.13\"></div>"
    + "<div class=\"blob\" style=\"width:340px;height:340px;bottom:-100px;left:-70px;background:var(--color-accent-1);opacity:.10\"></div>"
    + "<div class=\"blob\" style=\"width:220px;height:220px;top:38%;left:18%;background:var(--color-accent-3);opacity:.09\"></div></div>");

function emojiNode(slide: Slide): ElementNode<"div"> | null {
    if (slide.emojis.length === 0) return null;
    return div({ class: "feature-emoji", data: { animation: "reveal" } }, slide.emojis.join(" "));
}

function coverShell(slide: Slide): ElementNode<"div"> {
    const children: Array<DomNode> = [];
    const emoji = emojiNode(slide);
    if (emoji) children.push(emoji);
    if (slide.title) {
        children.push(h1({ class: "cover-title", data: { animation: "reveal" } }, slide.title));
        children.push(titleRule(slide.title));
    }
    const text = proseText(slide);
    if (isProse(slide) && text && !RICH.test(text)) {
        const paras = paragraphsOf(text);
        paras.forEach((para, index) => {
            const cls = index === 0 ? "eyebrow" : (index === paras.length - 1 ? "cover-sub" : "cover-meta");
            children.push(p({ class: cls, data: { animation: "reveal" } }, para));
        });
    } else
        for (const node of renderBlocks(slide.blocks)) children.push(node);

    return div({ class: "content text-center" }, children);
}

function sectionShell(slide: Slide): ElementNode<"div"> {
    const children: Array<DomNode> = [];
    const emoji = emojiNode(slide);
    if (emoji) children.push(emoji);
    if (slide.title) {
        children.push(h1({ class: "section-title", data: { animation: "reveal" } }, slide.title));
        children.push(titleRule(slide.title));
    }
    const text = proseText(slide);
    if (isProse(slide) && text && !RICH.test(text)) {
        const paras = paragraphsOf(text).map((para) => p({ data: { animation: "reveal" } }, para));
        children.push(div({ class: "section-block" }, paras));
    } else
        for (const node of renderBlocks(slide.blocks)) children.push(node);

    return div({ class: "content text-center" }, children);
}

function contentShell(slide: Slide): ElementNode<"div"> {
    const children: Array<DomNode> = [];
    const emoji = emojiNode(slide);
    if (emoji) children.push(emoji);
    if (slide.title) {
        children.push(h2({ class: "slide-title", data: { animation: "reveal" } }, slide.title));
        children.push(titleRule(slide.title));
    }
    for (const node of renderBlocks(slide.blocks)) children.push(node);
    return div({ class: "content flow" }, children);
}

const SHELLS: Record<SlideLayout, (slide: Slide) => ElementNode<"div">> = {
    [SlideLayout.Cover]: coverShell,
    [SlideLayout.Section]: sectionShell,
    [SlideLayout.Content]: contentShell
};

export function slideNodes(
    slide: Slide,
    index: number,
    total: number,
    particlesOn: boolean
): Array<DomNode> {
    const layout = resolveLayout(slide, index, total);
    const particles = particlesOn && layout !== SlideLayout.Content;
    const nodes: Array<DomNode> = [];
    for (const node of MESH_NODES) nodes.push(node);
    if (particles) nodes.push(canvas({ class: "particle-canvas", data: { animation: "reveal" } }));
    nodes.push(SHELLS[layout](slide));
    return nodes;
}

