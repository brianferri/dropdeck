import { BinaryOperator, MathConstant, MathFunction } from "@dropdeck/math";
import { invert, keyGuard, memberGuard } from "@dropdeck/common";
import type { MathAccent } from "@dropdeck/math";
import type { NaryGlyph } from "#/formula/nary";

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
    [BinaryOperator.Or]: "∨"
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

// The glyphs are proven to be shared `NaryGlyph`s, so a math call can only emit a sign the renderers already
// classify as nary -- math and the latex frontend cannot drift on what counts as a big operator.
// The big operators narrow out of `MathFunction`, so `NARY_GLYPH` is a strict (impartial) Record over exactly
// them -- adding a nary member without a glyph, or vice versa, fails to compile.
type NaryFunctionMember = Extract<MathFunction,
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
export const NARY_GLYPH = {
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
} as const satisfies Record<NaryFunctionMember, NaryGlyph>;

// Callees carry their glyph by name: nary via the table above, accents straight off `MathAccent` -- so a new
// callee is one enum entry, never a literal in the dispatch.
export type NaryGlyphTable = { [Function in keyof typeof NARY_GLYPH as `${Function}`]: (typeof NARY_GLYPH)[Function] };
export type NaryFunction = keyof NaryGlyphTable;
export type AccentFunction = `${MathAccent}`;

export const isMathFunction = memberGuard<MathFunction>(Object.values(MathFunction));
export const isNaryFunction = keyGuard(NARY_GLYPH);

// Every math glyph is unique, so each reverse table inverts its forward map one-to-one at the type level.
type MathTokenTable = { [Op in keyof typeof OPERATOR_GLYPH as (typeof OPERATOR_GLYPH)[Op]]: Op };
type MathConstantTable = { [Name in keyof typeof CONSTANT_GLYPH as (typeof CONSTANT_GLYPH)[Name]]: Name };
export type MathCalleeTable = { [Callee in keyof typeof NARY_GLYPH as (typeof NARY_GLYPH)[Callee]]: Callee };

export const MATH_TOKEN_BY_GLYPH = invert(OPERATOR_GLYPH);
export const CONSTANT_BY_GLYPH = invert(CONSTANT_GLYPH);
export const CALLEE_BY_GLYPH = invert(NARY_GLYPH);

// Each guard narrows a glyph to its reverse table's keys, so the serialiser indexes the static table directly.
export const isTokenGlyph = keyGuard(MATH_TOKEN_BY_GLYPH);
export const isConstantGlyph = keyGuard(CONSTANT_BY_GLYPH);
export const isCalleeGlyph = keyGuard(CALLEE_BY_GLYPH);

export type MathToken<Glyph extends string> = Glyph extends keyof MathTokenTable ? `${MathTokenTable[Glyph]}` : Glyph;
export type MathConstantName<Glyph extends string> = Glyph extends keyof MathConstantTable ? `${MathConstantTable[Glyph]}` : Glyph;
