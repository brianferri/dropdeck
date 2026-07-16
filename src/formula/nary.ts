import type { LimWord, NaryGlyph, NaryIntegralGlyph } from "#/formula/latex/glyphs";

// The nary glyphs are derived in the frontend from enum members flipped through the glyph table, so this shared
// classification never spells a glyph out; renderers import them from here.
export type { LimWord, NaryGlyph, NaryIntegralGlyph, NaryStackedGlyph } from "#/formula/latex/glyphs";

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

export function isLimWord(glyph: string): glyph is LimWord {
    switch (glyph) {
        case "lim":
        case "lim sup":
        case "lim inf":
        case "max":
        case "min":
        case "sup":
        case "inf":
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

export type LimitOperatorGlyph = NaryGlyph | LimWord;
export function isLimitOperatorGlyph(glyph: string): glyph is LimitOperatorGlyph {
    if (isNaryGlyph(glyph)) return true;
    return isLimWord(glyph);
}
