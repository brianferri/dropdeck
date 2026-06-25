export const SLIDE_WIDTH_PX = 1280;
export const SLIDE_HEIGHT_PX = 720;

const EMU_PER_PX = 9525; // 12192000 EMU / 1280 px -- the slide is exactly 13.333in wide.
// Decks author type against Slidev's ~1120px canvasWidth, so a CSS px renders ~1.13x larger on the physical
// slide than the 1280px layout grid implies; scaling only the point conversion by that ratio lands fonts at the
// rendered size without moving any layout coordinate.
const CENTIPOINTS_PER_PX = 85; // 75 * (1280 / 1120); OOXML font size is in hundredths of a point.

export const SLIDE_WIDTH_EMU = SLIDE_WIDTH_PX * EMU_PER_PX;
export const SLIDE_HEIGHT_EMU = SLIDE_HEIGHT_PX * EMU_PER_PX;

export function emu(px: number): number {
    return Math.round(px * EMU_PER_PX);
}

export function fontSize(px: number): number {
    return Math.round(px * CENTIPOINTS_PER_PX);
}
