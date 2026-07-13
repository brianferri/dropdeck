import { test, expect } from "vitest";
import { lowerLatex, toMathML } from "#/formula";
import { parse as parseLatex } from "@dropdeck/latex";
import { xml } from "@dropdeck/xml";
import type { LatexGlyph } from "#/formula";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

export type GlyphMapping = [
    Expect<Equal<LatexGlyph<"\\pi">, "π">>,
    Expect<Equal<LatexGlyph<"\\Omega">, "Ω">>,
    Expect<Equal<LatexGlyph<"\\partial">, "∂">>,
    Expect<Equal<LatexGlyph<"\\infty">, "∞">>,
    Expect<Equal<LatexGlyph<"\\hbar">, "ℏ">>,
    Expect<Equal<LatexGlyph<"\\sin">, "sin">>,
    Expect<Equal<LatexGlyph<"\\int">, "∫">>,
    Expect<Equal<LatexGlyph<"\\sum">, "∑">>,
    Expect<Equal<LatexGlyph<"\\cdot">, "·">>,
    Expect<Equal<LatexGlyph<"\\otimes">, "⊗">>,
    Expect<Equal<LatexGlyph<"x">, "x">>,
    Expect<Equal<LatexGlyph<"\\notacommand">, "unknown LaTeX command '\\notacommand'">>
];

test("an unrecognised command is surfaced as an error rather than rendered verbatim", () => {
    expect(() => lowerLatex(parseLatex("\\notacommand"))).toThrow(/unknown LaTeX command/);
});

test("a bare identifier passes through, a known command maps to its glyph", () => {
    expect(xml(toMathML(lowerLatex(parseLatex("x"))))).toContain("<mi>x</mi>");
    expect(xml(toMathML(lowerLatex(parseLatex("\\Omega"))))).toContain("<mi>Ω</mi>");
    expect(xml(toMathML(lowerLatex(parseLatex("\\otimes"))))).toContain("<mo>⊗</mo>");
});
