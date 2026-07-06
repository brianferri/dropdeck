import { panel, paragraphOf, pProps, styledRun, textBox, txBodyOf } from "#/export/pptx/build";
import type { Motion } from "#/export/pptx/animations/timing";
import type { Palette } from "#/export/pptx/palette";
import type { RunStyle, Align, Anchor } from "#/export/pptx/build";
import type { AssetMap } from "#/ir";
import type { Node, SlideMedia } from "@dropdeck/pptx";

export const PANEL_PAD = 22;
export const PANEL_RADIUS = 20;

export type AnimatedShapeRef = { shapes: ReadonlyArray<Node>, kind: Motion };
export type Lowered = { shapes: ReadonlyArray<Node>, height: number, media: ReadonlyArray<SlideMedia>, anim: ReadonlyArray<AnimatedShapeRef> };

export type Embed = {
    nextId: () => number,
    nextRelId: () => string,
    palette: Palette,
    assets: AssetMap,
    svgPngs: Map<string, string>
};

export function lowered(
    shapes: ReadonlyArray<Node>,
    height: number,
    side: { media?: ReadonlyArray<SlideMedia>, anim?: ReadonlyArray<AnimatedShapeRef> } = {}
): Lowered {
    return { shapes, height, media: side.media ?? [], anim: side.anim ?? [] };
}

export function glassPanel(
    nextId: () => number,
    x: number,
    y: number,
    width: number,
    height: number,
    palette: Palette,
    radiusPx: number
): ReturnType<typeof panel> {
    return panel(nextId, x, y, width, height, palette.glassColor, radiusPx, palette.glassOpacity, palette.borderColor, palette.borderOpacity);
}

export function runBox(
    nextId: () => number,
    x: number,
    y: number,
    width: number,
    height: number,
    anchor: Anchor,
    align: Align,
    text: string,
    style: RunStyle,
    insetPx?: number,
    name: string = "tx"
): ReturnType<typeof textBox> {
    return textBox(nextId, x, y, width, height, txBodyOf(anchor, [paragraphOf(pProps(align, 0, 0), [styledRun(text, style)])], insetPx), name);
}
