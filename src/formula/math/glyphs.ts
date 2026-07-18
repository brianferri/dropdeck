import { BinaryOperator, MathConstant, MathFunction, MathIntegral, MathLimit } from "@dropdeck/math";
import { invert, keyGuard, memberGuard } from "@dropdeck/common";
import { LimitPlacement, MathVariant } from "#/formula/nodes";
import type { MathAccent } from "@dropdeck/math";

export const OPERATOR_GLYPH = {
    [BinaryOperator.Add]: "+",
    [BinaryOperator.Subtract]: "-",
    [BinaryOperator.Multiply]: "·",
    [BinaryOperator.Divide]: "/",
    [BinaryOperator.Power]: "^",
    [BinaryOperator.LessThan]: "<",
    [BinaryOperator.GreaterThan]: ">",
    [BinaryOperator.LessOrEqual]: "≤",
    [BinaryOperator.GreaterOrEqual]: "≥",
    [BinaryOperator.Equal]: "=",
    [BinaryOperator.NotEqual]: "≠",
    [BinaryOperator.And]: "∧",
    [BinaryOperator.Or]: "∨",
    [BinaryOperator.Approx]: "≈",
    [BinaryOperator.Equiv]: "≡",
    [BinaryOperator.Cong]: "≅",
    [BinaryOperator.Sim]: "∼",
    [BinaryOperator.Simeq]: "≃",
    [BinaryOperator.Ll]: "≪",
    [BinaryOperator.Gg]: "≫",
    [BinaryOperator.In]: "∈",
    [BinaryOperator.Notin]: "∉",
    [BinaryOperator.Ni]: "∋",
    [BinaryOperator.Parallel]: "∥",
    [BinaryOperator.Mid]: "∣",
    [BinaryOperator.Perp]: "⊥",
    [BinaryOperator.To]: "→",
    [BinaryOperator.Gets]: "←",
    [BinaryOperator.Mapsto]: "↦",
    [BinaryOperator.Uparrow]: "↑",
    [BinaryOperator.Downarrow]: "↓",
    [BinaryOperator.Leftrightarrow]: "↔",
    [BinaryOperator.Longleftarrow]: "⟵",
    [BinaryOperator.Longrightarrow]: "⟶",
    [BinaryOperator.Hookrightarrow]: "↪",
    [BinaryOperator.LeftarrowDouble]: "⇐",
    [BinaryOperator.RightarrowDouble]: "⇒",
    [BinaryOperator.LeftrightarrowDouble]: "⇔",
    [BinaryOperator.Implies]: "⟹",
    [BinaryOperator.Iff]: "⟺"
} as const satisfies Record<BinaryOperator, string>;

export const CONSTANT_GLYPH = {
    [MathConstant.Pi]: "π",
    [MathConstant.E]: "e",
    [MathConstant.Tau]: "τ",
    [MathConstant.Alpha]: "α",
    [MathConstant.Beta]: "β",
    [MathConstant.Gamma]: "γ",
    [MathConstant.Delta]: "δ",
    [MathConstant.Epsilon]: "ε",
    [MathConstant.Zeta]: "ζ",
    [MathConstant.Eta]: "η",
    [MathConstant.Theta]: "θ",
    [MathConstant.Vartheta]: "ϑ",
    [MathConstant.Iota]: "ι",
    [MathConstant.Kappa]: "κ",
    [MathConstant.Lambda]: "λ",
    [MathConstant.Mu]: "μ",
    [MathConstant.Nu]: "ν",
    [MathConstant.Xi]: "ξ",
    [MathConstant.Rho]: "ρ",
    [MathConstant.Varrho]: "ϱ",
    [MathConstant.Sigma]: "σ",
    [MathConstant.Varsigma]: "ς",
    [MathConstant.Upsilon]: "υ",
    [MathConstant.Phi]: "φ",
    [MathConstant.Varphi]: "ϕ",
    [MathConstant.Chi]: "χ",
    [MathConstant.Psi]: "ψ",
    [MathConstant.Omega]: "ω",
    [MathConstant.UpperGamma]: "Γ",
    [MathConstant.UpperDelta]: "Δ",
    [MathConstant.UpperTheta]: "Θ",
    [MathConstant.UpperLambda]: "Λ",
    [MathConstant.UpperXi]: "Ξ",
    [MathConstant.UpperPi]: "Π",
    [MathConstant.UpperSigma]: "Σ",
    [MathConstant.UpperUpsilon]: "Υ",
    [MathConstant.UpperPhi]: "Φ",
    [MathConstant.UpperPsi]: "Ψ",
    [MathConstant.UpperOmega]: "Ω",
    [MathConstant.Partial]: "∂",
    [MathConstant.Nabla]: "∇",
    [MathConstant.Infty]: "∞",
    [MathConstant.Hbar]: "ℏ",
    [MathConstant.Ell]: "ℓ",
    [MathConstant.Aleph]: "ℵ",
    [MathConstant.Re]: "ℜ",
    [MathConstant.Im]: "ℑ",
    [MathConstant.Angle]: "∠",
    [MathConstant.Prime]: "′",
    [MathConstant.Ldots]: "…",
    [MathConstant.Cdots]: "⋯",
    [MathConstant.Vdots]: "⋮",
    [MathConstant.Ddots]: "⋱"
} as const satisfies Record<MathConstant, string>;

// The big operators narrow out of `MathFunction`, so `BIG_OPERATOR_GLYPH` is a strict Record over exactly them --
// adding a member without a glyph, or vice versa, fails to compile. Math describes its own glyphs from these tables;
// the shared `limit_operator` layer proves it and latex's coincide, so neither frontend owns the classification.
type BigOperatorMember = Extract<MathFunction,
    | MathFunction.Sum
    | MathFunction.Prod
    | MathFunction.Coprod
    | MathFunction.Bigcup
    | MathFunction.Bigcap
    | MathFunction.Bigvee
    | MathFunction.Bigwedge
    | MathFunction.Bigoplus
    | MathFunction.Bigotimes
    | MathFunction.Bigsqcup
>;
export const BIG_OPERATOR_GLYPH = {
    [MathFunction.Sum]: "∑",
    [MathFunction.Prod]: "∏",
    [MathFunction.Coprod]: "∐",
    [MathFunction.Bigcup]: "⋃",
    [MathFunction.Bigcap]: "⋂",
    [MathFunction.Bigvee]: "⋁",
    [MathFunction.Bigwedge]: "⋀",
    [MathFunction.Bigoplus]: "⨁",
    [MathFunction.Bigotimes]: "⨂",
    [MathFunction.Bigsqcup]: "⨆"
} as const satisfies Record<BigOperatorMember, string>;

export type AccentFunction = `${MathAccent}`;

export const INTEGRAL_GLYPH = {
    [MathIntegral.Int]: "∫",
    [MathIntegral.Oint]: "∮",
    [MathIntegral.Iint]: "∬",
    [MathIntegral.Iiint]: "∭"
} as const satisfies Record<MathIntegral, string>;

export const LIM_OPERATOR = {
    [MathLimit.Lim]: "lim",
    [MathLimit.Limsup]: "lim sup",
    [MathLimit.Liminf]: "lim inf",
    [MathLimit.Sup]: "sup",
    [MathLimit.Inf]: "inf",
    [MathLimit.Limmax]: "max",
    [MathLimit.Limmin]: "min"
} as const satisfies Record<MathLimit, string>;

// Math's own big-operator glyphs, read straight off its tables; the shared `limit_operator` layer proves it and
// latex's coincide, so this frontend never spells a glyph the other lacks nor consults latex to know what it emits.
export type IntegralGlyph = typeof INTEGRAL_GLYPH[keyof typeof INTEGRAL_GLYPH];
export type BigOperatorGlyph = typeof BIG_OPERATOR_GLYPH[keyof typeof BIG_OPERATOR_GLYPH] | IntegralGlyph;
export type LimWord = typeof LIM_OPERATOR[keyof typeof LIM_OPERATOR];

export const isMathFunction = memberGuard<MathFunction>(Object.values(MathFunction));
export const isBigOperatorFunction = keyGuard(BIG_OPERATOR_GLYPH);
export const isIntegralFunction = keyGuard(INTEGRAL_GLYPH);
export const isLimFunction = keyGuard(LIM_OPERATOR);

/** Font-variant directives (`bold(x)`, `bb(R)`), each mapping to a shared `MathVariant` via `MATH_VARIANT`. */
export enum MathVariantFunction {
    Bold = "bold",
    Italic = "italic",
    Roman = "roman",
    Bolditalic = "bolditalic",
    Bb = "bb",
    Cal = "cal",
    Frak = "frak",
    Sans = "sans",
    Mono = "mono"
}
export const MATH_VARIANT = {
    [MathVariantFunction.Bold]: MathVariant.Bold,
    [MathVariantFunction.Italic]: MathVariant.Italic,
    [MathVariantFunction.Roman]: MathVariant.Normal,
    [MathVariantFunction.Bolditalic]: MathVariant.BoldItalic,
    [MathVariantFunction.Bb]: MathVariant.DoubleStruck,
    [MathVariantFunction.Cal]: MathVariant.Script,
    [MathVariantFunction.Frak]: MathVariant.Fraktur,
    [MathVariantFunction.Sans]: MathVariant.SansSerif,
    [MathVariantFunction.Mono]: MathVariant.Monospace
} as const satisfies Record<MathVariantFunction, MathVariant>;
export const isVariantFunction = keyGuard(MATH_VARIANT);
export const VARIANT_CALLEE = invert(MATH_VARIANT);

/** `color(c, x)` colors `x` the color named by `c`. */
export enum ColorFunction {
    Color = "color"
}
export const isColorFunction = memberGuard<ColorFunction>(Object.values(ColorFunction));

/** `limits(op)`/`nolimits(op)` force a big operator's bounds stacked or beside, the twin of `\limits`/`\nolimits`. */
export enum LimitsFunction {
    Limits = "limits",
    Nolimits = "nolimits"
}
export const LIMITS_PLACEMENT = {
    [LimitsFunction.Limits]: LimitPlacement.Stacked,
    [LimitsFunction.Nolimits]: LimitPlacement.Beside
} as const satisfies Record<LimitsFunction, LimitPlacement>;
export const isLimitsFunction = keyGuard(LIMITS_PLACEMENT);

// Every math glyph is unique, so each reverse table inverts its forward map one-to-one at the type level.
type MathTokenTable = { [Op in keyof typeof OPERATOR_GLYPH as (typeof OPERATOR_GLYPH)[Op]]: Op };
type MathConstantTable = { [Name in keyof typeof CONSTANT_GLYPH as (typeof CONSTANT_GLYPH)[Name]]: Name };
export type MathCalleeTable = { [Callee in keyof typeof BIG_OPERATOR_GLYPH as (typeof BIG_OPERATOR_GLYPH)[Callee]]: Callee };

export const MATH_TOKEN_BY_GLYPH = invert(OPERATOR_GLYPH);
export const CONSTANT_BY_GLYPH = invert(CONSTANT_GLYPH);
export const CALLEE_BY_GLYPH = invert(BIG_OPERATOR_GLYPH);

// Each guard narrows a glyph to its reverse table's keys, so the serialiser indexes the static table directly.
export const isTokenGlyph = keyGuard(MATH_TOKEN_BY_GLYPH);
export const isConstantGlyph = keyGuard(CONSTANT_BY_GLYPH);
export const isCalleeGlyph = keyGuard(CALLEE_BY_GLYPH);

export type MathToken<Glyph extends string> = Glyph extends keyof MathTokenTable ? `${MathTokenTable[Glyph]}` : Glyph;
export type MathConstantName<Glyph extends string> = Glyph extends keyof MathConstantTable ? `${MathConstantTable[Glyph]}` : Glyph;
