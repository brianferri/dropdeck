import { cSld, element, fade, Namespace, slide, transition } from "@dropdeck/pptx";
import { Align, Anchor, backgroundRect, idFactory, paragraphOf, pProps, relFactory, rule, spTreeOf, styledRun, textBox, txBodyOf } from "#/export/pptx/build";
import { meshShapes, particleShapes } from "#/export/pptx/ambient";
import { lowerBlocks, measuredHeight } from "#/export/pptx/blocks";
import { AnimationKind, slideTiming } from "#/export/pptx/timing";
import { isProse, proseText, resolveLayout } from "#/layout";
import { SlideLayout } from "#/ir";
import type { Palette } from "#/export/pptx/palette";
import type { AnimatedShapeRef, Embed } from "#/export/pptx/blocks";
import type { CT_CommonSlideData, CT_Shape, CT_Slide, CT_TextParagraph, DeckSlide, Node, SlideInput, SlideMedia } from "@dropdeck/pptx";
import type { AnimatedShape } from "#/export/pptx/timing";
import type { AssetMap, Slide } from "#/ir";

// Mirrored from `slide()` because `animatedSlide` builds the `p:sld` element directly.
const SLIDE_NAMESPACES = [["xmlns:a", Namespace.a], ["xmlns:p", Namespace.p], ["xmlns:r", Namespace.r]] as const;

// sp/pic/graphicFrame all nest cNvPr the same way, so one path reaches the drawing id for any of them.
function shapeId(node: Node): number | null {
    if (!("children" in node)) return null;
    const [nonVisual] = node.children;
    if (!("children" in nonVisual)) return null;
    const [drawingProps] = nonVisual.children;
    if (!("attrs" in drawingProps)) return null;
    for (const attr of drawingProps.attrs) if (attr[0] === "id") return Number(attr[1]);
    return null;
}

function collectAnimations(
    shapes: ReadonlyArray<Node>,
    contentStart: number,
    requested: ReadonlyArray<AnimatedShapeRef>
): Array<AnimatedShape> {
    const claimed = new Set<Node>();
    const lead = new Map<Node, AnimatedShape>();
    for (const ref of requested) {
        for (const shape of ref.shapes) claimed.add(shape);
        const ids = ref.shapes.map(shapeId).filter((id): id is number => id !== null);
        if (ids.length === 0) continue;
        lead.set(ref.shapes[0], ref.kind === AnimationKind.Counter ? { kind: ref.kind, frames: ids } : { kind: ref.kind, id: ids[0] });
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
        const id = shapeId(shape);
        if (id !== null) animations.push({ id, kind: AnimationKind.Fade });
    }
    return animations;
}

// `slide()` stops at the transition, so the timing child is appended by hand.
function animatedSlide(
    common: CT_CommonSlideData,
    animatedIds: ReadonlyArray<AnimatedShape>
): CT_Slide {
    const timing = slideTiming(animatedIds);
    if (timing === null) return slide(common, transition(fade()));
    const children: ReadonlyArray<Node> = [common, transition(fade()), timing];
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
        const headHeight = slideEl.title !== null ? 150 : 0;
        const totalHeight = headHeight + measureBlocks(slideEl, embed);
        let cursorY = Math.max(80, Math.round((720 - totalHeight) / 2));
        if (slideEl.title !== null) {
            shapes.push(textBox(nextId, CONTENT_X, cursorY, CONTENT_WIDTH, 110, txBodyOf(Anchor.Top, [titleParagraph(slideEl.title, titleSize, palette)])));
            cursorY += 120;
            shapes.push(rule(nextId, (1280 - 64) / 2, cursorY, 64, palette.accent1));
            cursorY += 30;
        }
        const content = lowerBlocks(slideEl.blocks, embed, CONTENT_X, cursorY, CONTENT_WIDTH, Align.Center);
        for (const shape of content.shapes) shapes.push(shape);
        ({ media, anim } = content);
    }

    const animatedIds = collectAnimations(shapes, contentStart, anim);
    return { slide: animatedSlide(cSld(spTreeOf(shapes)), animatedIds), media };
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
        shapes.push(textBox(nextId, CONTENT_X, cursorY, CONTENT_WIDTH, 64, body));
        cursorY += 70;
        shapes.push(rule(nextId, CONTENT_X, cursorY, 56, palette.accent1));
        cursorY += 28;
    }
    const content = lowerBlocks(slideEl.blocks, embed, CONTENT_X, cursorY, CONTENT_WIDTH);
    for (const shape of content.shapes) shapes.push(shape);
    const animatedIds = collectAnimations(shapes, contentStart, content.anim);
    return { slide: animatedSlide(cSld(spTreeOf(shapes)), animatedIds), media: content.media };
}

export function lowerSlide(
    slideEl: Slide,
    index: number,
    total: number,
    palette: Palette,
    assets: AssetMap
): SlideInput {
    const embed: Embed = { nextId: idFactory(), nextRelId: relFactory(), palette, assets };
    const layout = resolveLayout(slideEl, index, total);
    if (layout === SlideLayout.Cover) return centeredSlide(slideEl, SIZE.coverTitle, true, embed);
    if (layout === SlideLayout.Section) return centeredSlide(slideEl, SIZE.sectionTitle, false, embed);
    return contentSlide(slideEl, embed);
}

export type { CT_Shape };
