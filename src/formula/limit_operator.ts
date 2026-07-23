import { memberGuard } from "@dropdeck/common";
import type { BigOperatorGlyph as LatexBigOperatorGlyph, IntegralGlyph as LatexIntegralGlyph, LimWord as LatexLimWord } from "#/formula/latex/glyphs";
import type { BigOperatorGlyph as MathBigOperatorGlyph, IntegralGlyph as MathIntegralGlyph, LimWord as MathLimWord } from "#/formula/math/glyphs";
import type { Expect, FieldsAgree } from "@dropdeck/common";

// The canonical glyphs each limit category emits -- Unicode owned by neither frontend, so they live here. The runtime
// guards derive from these arrays and the exported types from `typeof`, so a glyph the guard accepts can never drift
// from one the type admits; the `FieldsAgree` proofs below then hold both frontends to this same canonical set.
const INTEGRAL_GLYPHS = ["∫", "∮", "∬", "∭"] as const;
const BIG_OPERATOR_GLYPHS = ["∑", "∏", "∐", "⋃", "⋂", "⋁", "⋀", "⨁", "⨂", "⨆"] as const;
const LIM_WORDS = ["lim", "lim sup", "lim inf", "max", "min", "sup", "inf"] as const;

export type IntegralGlyph = (typeof INTEGRAL_GLYPHS)[number];
export type BigOperatorGlyph = (typeof BIG_OPERATOR_GLYPHS)[number] | IntegralGlyph;
export type LimWord = (typeof LIM_WORDS)[number];
export type LimitOperatorGlyph = BigOperatorGlyph | LimWord;

// Integrals set their limits beside the sign; every other big operator stacks them. Renderers key on the glyph.
export const isIntegralGlyph = memberGuard(INTEGRAL_GLYPHS);
export const isLimWord = memberGuard(LIM_WORDS);
const isBigOperatorOnly = memberGuard(BIG_OPERATOR_GLYPHS);

export function isBigOperatorGlyph(glyph: string): glyph is BigOperatorGlyph {
    return isBigOperatorOnly(glyph) || isIntegralGlyph(glyph);
}

export function isLimitOperatorGlyph(glyph: string): glyph is LimitOperatorGlyph {
    return isBigOperatorGlyph(glyph) || isLimWord(glyph);
}

// Each frontend emits its own glyphs per category; a glyph one emits and another lacks (or spells differently) fails
// these proofs, and holding the canonical set alongside both frontends checks the runtime source against them too.
enum LimitCategory {
    BigOperator = "bigOperator",
    Integral = "integral",
    LimWord = "limWord"
}
type LimitGlyphsOf<Big extends string, Int extends string, Lim extends string> = {
    [LimitCategory.BigOperator]: Big,
    [LimitCategory.Integral]: Int,
    [LimitCategory.LimWord]: Lim
};
type Frontends = readonly [
    LimitGlyphsOf<BigOperatorGlyph, IntegralGlyph, LimWord>,
    LimitGlyphsOf<LatexBigOperatorGlyph, LatexIntegralGlyph, LatexLimWord>,
    LimitGlyphsOf<MathBigOperatorGlyph, MathIntegralGlyph, MathLimWord>
];

export type BigOperatorGlyphsAgree = Expect<FieldsAgree<Frontends, LimitCategory.BigOperator>>;
export type IntegralGlyphsAgree = Expect<FieldsAgree<Frontends, LimitCategory.Integral>>;
export type LimWordsAgree = Expect<FieldsAgree<Frontends, LimitCategory.LimWord>>;
