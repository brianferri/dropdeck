import { cSld, element, Namespace } from "@dropdeck/pptx";
import { Align, Anchor, backgroundRect, idFactory, paragraphOf, pProps, relFactory, rule, spTreeOf, styledRun, textBox, txBodyOf } from "#/export/pptx/build";
import { meshShapes, particleShapes } from "#/export/pptx/ambient";
import { lowerBlocks, measuredHeight } from "#/export/pptx/blocks";
import { Motion, slideTiming } from "#/export/pptx/animations/timing";
import { slideTransition } from "#/export/pptx/animations/transition";
import { morphName, resolveTransition, SlideTransition } from "#/animations/spec";
import { isProse, proseText, resolveLayout } from "#/layout";
import { SlideLayout } from "#/ir";
import type { Palette } from "#/export/pptx/palette";
import type { AnimatedShapeRef, Embed } from "#/export/pptx/blocks";
import type { CT_CommonSlideData, CT_Shape, CT_Slide, CT_TextParagraph, DeckSlide, Node, SlideInput, SlideMedia } from "@dropdeck/pptx";
import type { AnimatedShape } from "#/export/pptx/animations/timing";
import type { AssetMap, Slide } from "#/ir";

// Mirrored from `slide()` because `animatedSlide` builds the `p:sld` element directly.
const SLIDE_NAMESPACES = [["xmlns:a", Namespace.a], ["xmlns:p", Namespace.p], ["xmlns:r", Namespace.r]] as const;

// sp/pic/graphicFrame all nest cNvPr the same way, so one path reaches a drawing prop for any of them.
function drawingAttr(node: Node, key: string): string | null {
    if (!("children" in node)) return null;
    const [nonVisual] = node.children;
    if (!("children" in nonVisual)) return null;
    const [drawingProps] = nonVisual.children;
    if (!("attrs" in drawingProps)) return null;
    for (const attr of drawingProps.attrs) if (attr[0] === key) return String(attr[1]);
    return null;
}

function shapeId(node: Node): number | null {
    const id = drawingAttr(node, "id");
    return id === null ? null : Number(id);
}

// On a morph slide, a content-matched shape (named `morph:<key>`) moves via the transition itself, so it gets no
// entrance; everything else -- bars, metrics, prose -- keeps its own animation, which thus overrides the morph.
function collectAnimations(
    shapes: ReadonlyArray<Node>,
    contentStart: number,
    requested: ReadonlyArray<AnimatedShapeRef>,
    morph: boolean
): Array<AnimatedShape> {
    const claimed = new Set<Node>();
    const lead = new Map<Node, AnimatedShape>();
    for (const ref of requested) {
        for (const shape of ref.shapes) claimed.add(shape);
        const ids = ref.shapes.map(shapeId).filter((id): id is number => id !== null);
        if (ids.length === 0) continue;
        lead.set(ref.shapes[0], ref.kind === Motion.Counter ? { kind: ref.kind, frames: ids } : { kind: ref.kind, id: ids[0] });
    }
    const animations: Array<AnimatedShape> = [];
    for (let index = contentStart; index < shapes.length; index += 1) {
        const shape = shapes[index];
        const claimedAnim = lead.get(shape);
        if (claimedAnim !== undefined) {
            animations.push(claimedAnim);
            continue;
        }
        if (claimed.has(shape)) continue;
        if (morph && (drawingAttr(shape, "name") ?? "").startsWith("!!morph:")) continue;
        const id = shapeId(shape);
        if (id !== null) animations.push({ id, kind: Motion.Fade });
    }
    return animations;
}

// `slide()` stops at the transition, so the transition and timing children are appended by hand, in schema order
// (`cSld`, `transition`, `timing`); a cut slide omits the transition entirely.
function animatedSlide(
    common: CT_CommonSlideData,
    animatedIds: ReadonlyArray<AnimatedShape>,
    transitionEl: Node | null
): CT_Slide {
    const timing = slideTiming(animatedIds);
    const children: ReadonlyArray<Node> =
        transitionEl === null
            ? (timing === null ? [common] : [common, timing])
            : (timing === null ? [common, transitionEl] : [common, transitionEl, timing]);
    return element("p:sld", SLIDE_NAMESPACES, children) as CT_Slide;
}

const MARGIN_PX = 44;
const CONTENT_X = MARGIN_PX;
const CONTENT_WIDTH = 1280 - (2 * MARGIN_PX);

const SIZE = {
    emoji: 60,
    coverTitle: 53,
    sectionTitle: 50,
    slideTitle: 43,
    eyebrow: 14,
    coverMeta: 18,
    coverSub: 15,
    sectionPara: 21
} as const;

const RICH = /<\w|[*_`[\]!>]/;

function paragraphsOf(text: string): Array<string> {
    return text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}

function emojiParagraph(slideEl: Slide, palette: Palette): Array<CT_TextParagraph> {
    if (slideEl.emojis.length === 0) return [];
    const text = slideEl.emojis.join(" ");
    return [paragraphOf(pProps(Align.Center, 0, 0), [styledRun(text, { sizePx: SIZE.emoji, color: palette.text, font: palette.body })])];
}

function titleParagraph(title: string, sizePx: number, palette: Palette): CT_TextParagraph {
    return paragraphOf(pProps(Align.Center, 0, 0), [styledRun(title, { sizePx, bold: true, color: palette.text, font: palette.display })]);
}

function centeredSlide(
    slideEl: Slide,
    titleSize: number,
    isCover: boolean,
    embed: Embed
): DeckSlide {
    const { nextId, palette } = embed;
    const shapes: Array<Node> = [backgroundRect(nextId, palette.bg)];
    for (const shape of meshShapes(nextId, palette)) shapes.push(shape);
    for (const shape of particleShapes(nextId, palette)) shapes.push(shape);
    const contentStart = shapes.length;
    let media: ReadonlyArray<SlideMedia> = [];
    let anim: ReadonlyArray<AnimatedShapeRef> = [];

    const text = proseText(slideEl);
    if ((isProse(slideEl) && text.length > 0 && !RICH.test(text)) || slideEl.blocks.length === 0) {
        const paragraphs: Array<CT_TextParagraph> = [];
        for (const para of emojiParagraph(slideEl, palette)) paragraphs.push(para);
        if (slideEl.title !== null) paragraphs.push(titleParagraph(slideEl.title, titleSize, palette));
        const paras = paragraphsOf(text);
        paras.forEach((para, index) => {
            const role = coverRole(index, paras.length, isCover);
            const spaceBefore = index === 0 ? 0 : Math.round(role.size * 0.6);
            paragraphs.push(paragraphOf(pProps(Align.Center, 0, 0, spaceBefore), [styledRun(role.transform(para), { sizePx: role.size, color: role.color(palette), font: palette.body })]));
        });
        shapes.push(textBox(nextId, CONTENT_X, 0, CONTENT_WIDTH, 720, txBodyOf(Anchor.Center, paragraphs)));
    } else {
        // The box wraps the line so the rule can sit a fixed ~0.6rem below the actual text, not below a fixed
        // oversized frame -- otherwise the underline floats far under the title, unlike the tight HTML gap.
        const titleHeight = Math.round(titleSize * 1.2);
        const headHeight = slideEl.title !== null ? titleHeight + 32 : 0;
        const totalHeight = headHeight + measureBlocks(slideEl, embed);
        let cursorY = Math.max(80, Math.round((720 - totalHeight) / 2));
        if (slideEl.title !== null) {
            shapes.push(textBox(nextId, CONTENT_X, cursorY, CONTENT_WIDTH, titleHeight, txBodyOf(Anchor.Top, [titleParagraph(slideEl.title, titleSize, palette)]), morphName(slideEl.title)));
            cursorY += titleHeight + 8;
            shapes.push(rule(nextId, (1280 - 64) / 2, cursorY, 64, palette.accent1, `${morphName(slideEl.title)}-rule`));
            cursorY += 24;
        }
        const content = lowerBlocks(slideEl.blocks, embed, CONTENT_X, cursorY, CONTENT_WIDTH, Align.Center);
        for (const shape of content.shapes) shapes.push(shape);
        ({ media, anim } = content);
    }

    const transitionKind = resolveTransition(slideEl.frontmatter);
    const animatedIds = collectAnimations(shapes, contentStart, anim, transitionKind === SlideTransition.Morph);
    return { slide: animatedSlide(cSld(spTreeOf(shapes)), animatedIds, slideTransition(transitionKind)), media };
}

function coverRole(
    index: number,
    count: number,
    isCover: boolean
): { size: number, transform: (s: string) => string, color: (p: Palette) => string } {
    if (!isCover) return { size: SIZE.sectionPara, transform: (s) => s, color: (p) => p.secondary };
    if (index === 0) return { size: SIZE.eyebrow, transform: (s) => s.toUpperCase(), color: (p) => p.muted };
    if (index === count - 1) return { size: SIZE.coverSub, transform: (s) => s, color: (p) => p.muted };
    return { size: SIZE.coverMeta, transform: (s) => s, color: (p) => p.secondary };
}

// A dry pass for height, so the real pass can vertically centre the column the way the flex `.content` does.
function measureBlocks(slideEl: Slide, embed: Embed): number {
    return measuredHeight(embed, (trial) => lowerBlocks(slideEl.blocks, trial, CONTENT_X, 0, CONTENT_WIDTH));
}

function contentSlide(slideEl: Slide, embed: Embed): DeckSlide {
    const { nextId, palette } = embed;
    const shapes: Array<Node> = [backgroundRect(nextId, palette.bg)];
    for (const shape of meshShapes(nextId, palette)) shapes.push(shape);
    const contentStart = shapes.length;

    const headHeight = (slideEl.emojis.length > 0 ? 84 : 0) + (slideEl.title !== null ? 98 : 0);
    const totalHeight = headHeight + measureBlocks(slideEl, embed);
    let cursorY = Math.max(56, Math.round((720 - totalHeight) / 2));

    if (slideEl.emojis.length > 0) {
        const body = txBodyOf(Anchor.Top, [
            paragraphOf(pProps(Align.Left, 0, 0), [
                styledRun(slideEl.emojis.join(" "), {
                    sizePx: SIZE.emoji,
                    color: palette.text,
                    font: palette.body
                })
            ])
        ]);
        shapes.push(textBox(nextId, CONTENT_X, cursorY, CONTENT_WIDTH, 80, body));
        cursorY += 84;
    }
    if (slideEl.title !== null) {
        const body = txBodyOf(Anchor.Bottom, [
            paragraphOf(pProps(Align.Left, 0, 0), [
                styledRun(slideEl.title, {
                    sizePx: SIZE.slideTitle,
                    bold: true,
                    color: palette.text,
                    font: palette.display
                })
            ])
        ]);
        shapes.push(textBox(nextId, CONTENT_X, cursorY, CONTENT_WIDTH, 64, body, morphName(slideEl.title)));
        cursorY += 70;
        shapes.push(rule(nextId, CONTENT_X, cursorY, 56, palette.accent1, `${morphName(slideEl.title)}-rule`));
        cursorY += 28;
    }
    const content = lowerBlocks(slideEl.blocks, embed, CONTENT_X, cursorY, CONTENT_WIDTH);
    for (const shape of content.shapes) shapes.push(shape);
    const transitionKind = resolveTransition(slideEl.frontmatter);
    const animatedIds = collectAnimations(shapes, contentStart, content.anim, transitionKind === SlideTransition.Morph);
    return { slide: animatedSlide(cSld(spTreeOf(shapes)), animatedIds, slideTransition(transitionKind)), media: content.media };
}

export function lowerSlide(
    slideEl: Slide,
    index: number,
    total: number,
    palette: Palette,
    assets: AssetMap,
    svgPngs: Map<string, string>
): SlideInput {
    const embed: Embed = { nextId: idFactory(), nextRelId: relFactory(), palette, assets, svgPngs };
    const layout = resolveLayout(slideEl, index, total);
    if (layout === SlideLayout.Cover) return centeredSlide(slideEl, SIZE.coverTitle, true, embed);
    if (layout === SlideLayout.Section) return centeredSlide(slideEl, SIZE.sectionTitle, false, embed);
    return contentSlide(slideEl, embed);
}

export type { CT_Shape };
