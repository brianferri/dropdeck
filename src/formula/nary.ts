import type { NaryGlyph, NaryIntegralGlyph } from "#/formula/latex/glyphs";

// The nary glyphs are derived in the frontend from enum members flipped through the glyph table, so this shared
// classification never spells a glyph out; renderers import them from here.
export type { NaryGlyph, NaryIntegralGlyph, NaryStackedGlyph } from "#/formula/latex/glyphs";

// Integrals set their limits beside the sign; every other big operator stacks them. Renderers key on the glyph.
export function isNaryIntegralGlyph(glyph: string): glyph is NaryIntegralGlyph {
    switch (glyph) {
        case "∫":
        case "∮":
        case "∬":
        case "∭":
            return true;
        default:
            return false;
    }
}

export function isNaryGlyph(glyph: string): glyph is NaryGlyph {
    switch (glyph) {
        case "∑":
        case "∏":
        case "∐":
        case "⋃":
        case "⋂":
        case "⋁":
        case "⋀":
        case "⨁":
        case "⨂":
        case "⨆":
            return true;
        default:
            return isNaryIntegralGlyph(glyph);
    }
}
