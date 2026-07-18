import type { BigOperatorGlyph as LatexBigOperatorGlyph, IntegralGlyph as LatexIntegralGlyph, LimWord as LatexLimWord } from "#/formula/latex/glyphs";
import type { BigOperatorGlyph as MathBigOperatorGlyph, IntegralGlyph as MathIntegralGlyph, LimWord as MathLimWord } from "#/formula/math/glyphs";
import type { Expect, FieldsAgree, IntersectField } from "@dropdeck/common";

/** The big-operator glyph categories every frontend must agree on. */
enum LimitCategory {
    BigOperator = "bigOperator",
    Integral = "integral",
    LimWord = "limWord"
}

// Each frontend emits its own glyphs for every category; this layer reconciles them so the renderers key on exactly
// the set every frontend agrees on. `LimitGlyphsOf` forces a frontend to cover every category.
type LimitGlyphsOf<Big extends string, Int extends string, Lim extends string> = {
    [LimitCategory.BigOperator]: Big,
    [LimitCategory.Integral]: Int,
    [LimitCategory.LimWord]: Lim
};
type LatexLimitGlyphs = LimitGlyphsOf<LatexBigOperatorGlyph, LatexIntegralGlyph, LatexLimWord>;
type MathLimitGlyphs = LimitGlyphsOf<MathBigOperatorGlyph, MathIntegralGlyph, MathLimWord>;

// Add a frontend here and every shared type and proof below extends to it -- nothing is wired per pair.
type Frontends = readonly [LatexLimitGlyphs, MathLimitGlyphs];

export type BigOperatorGlyph = IntersectField<Frontends, LimitCategory.BigOperator>;
export type IntegralGlyph = IntersectField<Frontends, LimitCategory.Integral>;
export type LimWord = IntersectField<Frontends, LimitCategory.LimWord>;

// A glyph one frontend emits and another lacks (or spells differently) fails these proofs at compile time.
export type BigOperatorGlyphsAgree = Expect<FieldsAgree<Frontends, LimitCategory.BigOperator>>;
export type IntegralGlyphsAgree = Expect<FieldsAgree<Frontends, LimitCategory.Integral>>;
export type LimWordsAgree = Expect<FieldsAgree<Frontends, LimitCategory.LimWord>>;

// Integrals set their limits beside the sign; every other big operator stacks them. Renderers key on the glyph.
export function isIntegralGlyph(glyph: string): glyph is IntegralGlyph {
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

export function isBigOperatorGlyph(glyph: string): glyph is BigOperatorGlyph {
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
            return isIntegralGlyph(glyph);
    }
}

export type LimitOperatorGlyph = BigOperatorGlyph | LimWord;
export function isLimitOperatorGlyph(glyph: string): glyph is LimitOperatorGlyph {
    if (isBigOperatorGlyph(glyph)) return true;
    return isLimWord(glyph);
}
