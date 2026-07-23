import type { Mul } from "#/typings/arithmetic";

export const SLIDE_WIDTH_PX = 1280;
export const SLIDE_HEIGHT_PX = 720;

// The browser renders the deck 1180px wide but the export lays it out on the 1280px grid, so an author's px
// dimension (an image width, a transform offset) scales up by this ratio to occupy the same fraction of the slide.
export const DECK_RATIO = 1280 / 1180;

const EMU_PER_PX = 9525; // 12192000 EMU / 1280 px -- the slide is exactly 13.333in wide.
// Decks author type against Slidev's ~1120px canvasWidth, so a CSS px renders ~1.13x larger on the physical
// slide than the 1280px layout grid implies; scaling only the point conversion by that ratio lands fonts at the
// rendered size without moving any layout coordinate.
const CENTIPOINTS_PER_PX = 85; // 75 * (1280 / 1120); OOXML font size is in hundredths of a point.

export function emu<const Px extends number>(px: Px): Mul<Px, typeof EMU_PER_PX> {
    return Math.round(px * EMU_PER_PX) as Mul<Px, typeof EMU_PER_PX>;
}

export function fontSize<const Px extends number>(px: Px): Mul<Px, typeof CENTIPOINTS_PER_PX> {
    return Math.round(px * CENTIPOINTS_PER_PX) as Mul<Px, typeof CENTIPOINTS_PER_PX>;
}

export const SLIDE_WIDTH_EMU = emu(SLIDE_WIDTH_PX);
export const SLIDE_HEIGHT_EMU = emu(SLIDE_HEIGHT_PX);
