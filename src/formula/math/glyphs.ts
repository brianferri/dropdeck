import { BinaryOperator, MathConstant, MathFunction } from "@dropdeck/math";
import { keyGuard, memberGuard } from "@dropdeck/common";
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
    [MathConstant.Tau]: "τ"
} as const satisfies Record<MathConstant, string>;

// The glyphs are proven to be shared `NaryGlyph`s, so a math call can only emit a sign the renderers already
// classify as nary -- math and the latex frontend cannot drift on what counts as a big operator.
// The big operators narrow out of `MathFunction`, so `NARY_GLYPH` is a strict (impartial) Record over exactly
// them -- adding a nary member without a glyph, or vice versa, fails to compile.
type NaryFunctionMember = Extract<MathFunction,
    MathFunction.Sum | MathFunction.Prod | MathFunction.Bigcup | MathFunction.Bigcap>;
export const NARY_GLYPH = {
    [MathFunction.Sum]: "∑",
    [MathFunction.Prod]: "∏",
    [MathFunction.Bigcup]: "⋃",
    [MathFunction.Bigcap]: "⋂"
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

// Serialising shared IR back to math source reverses the forward tables. Each key is pulled straight from the
// forward map, so a reverse entry never re-spells a glyph, and `satisfies` proves the inversion covers every one.
export const MATH_TOKEN_BY_GLYPH = {
    [OPERATOR_GLYPH[BinaryOperator.Add]]: BinaryOperator.Add,
    [OPERATOR_GLYPH[BinaryOperator.Subtract]]: BinaryOperator.Subtract,
    [OPERATOR_GLYPH[BinaryOperator.Multiply]]: BinaryOperator.Multiply,
    [OPERATOR_GLYPH[BinaryOperator.Divide]]: BinaryOperator.Divide,
    [OPERATOR_GLYPH[BinaryOperator.Power]]: BinaryOperator.Power,
    [OPERATOR_GLYPH[BinaryOperator.LessThan]]: BinaryOperator.LessThan,
    [OPERATOR_GLYPH[BinaryOperator.GreaterThan]]: BinaryOperator.GreaterThan,
    [OPERATOR_GLYPH[BinaryOperator.LessOrEqual]]: BinaryOperator.LessOrEqual,
    [OPERATOR_GLYPH[BinaryOperator.GreaterOrEqual]]: BinaryOperator.GreaterOrEqual,
    [OPERATOR_GLYPH[BinaryOperator.Equal]]: BinaryOperator.Equal,
    [OPERATOR_GLYPH[BinaryOperator.NotEqual]]: BinaryOperator.NotEqual,
    [OPERATOR_GLYPH[BinaryOperator.And]]: BinaryOperator.And,
    [OPERATOR_GLYPH[BinaryOperator.Or]]: BinaryOperator.Or
} as const satisfies MathTokenTable;
export const CONSTANT_BY_GLYPH = {
    [CONSTANT_GLYPH[MathConstant.Pi]]: MathConstant.Pi,
    [CONSTANT_GLYPH[MathConstant.E]]: MathConstant.E,
    [CONSTANT_GLYPH[MathConstant.Tau]]: MathConstant.Tau
} as const satisfies MathConstantTable;
export const CALLEE_BY_GLYPH = {
    [NARY_GLYPH[MathFunction.Sum]]: MathFunction.Sum,
    [NARY_GLYPH[MathFunction.Prod]]: MathFunction.Prod,
    [NARY_GLYPH[MathFunction.Bigcup]]: MathFunction.Bigcup,
    [NARY_GLYPH[MathFunction.Bigcap]]: MathFunction.Bigcap
} as const satisfies MathCalleeTable;

// Each guard narrows a glyph to its reverse table's keys, so the serialiser indexes the static table directly.
export const isTokenGlyph = keyGuard(MATH_TOKEN_BY_GLYPH);
export const isConstantGlyph = keyGuard(CONSTANT_BY_GLYPH);
export const isCalleeGlyph = keyGuard(CALLEE_BY_GLYPH);

export type MathToken<Glyph extends string> = Glyph extends keyof MathTokenTable ? `${MathTokenTable[Glyph]}` : Glyph;
export type MathConstantName<Glyph extends string> = Glyph extends keyof MathConstantTable ? `${MathConstantTable[Glyph]}` : Glyph;
