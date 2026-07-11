import { test, expect } from "vitest";
import { parse as parseMath } from "@dropdeck/math";
import { parse as parseLatex } from "@dropdeck/latex";
import { xml } from "@dropdeck/xml";
import { lowerLatex, lowerMath, toMathML, toOmml } from "#/formula";
import type { Expression, Parse as ParseMath } from "@dropdeck/math";
import type { Notation as LatexNotation, Parse as ParseLatex } from "@dropdeck/latex";
import type { Serialize } from "@dropdeck/xml";
import type { LowerLatex, LowerMath, ToMathML, ToOmml } from "#/formula";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type MathShared<M extends string> = ParseMath<M> extends infer E extends Expression ? LowerMath<E> : never;
type LatexShared<L extends string> = ParseLatex<L> extends infer N extends LatexNotation ? LowerLatex<N> : never;

// Semantic math and presentational latex lower to the identical shared IR
export type Convergence = [
    Expect<Equal<MathShared<"x^2">, LatexShared<"x^2">>>,
    Expect<Equal<MathShared<"x_i">, LatexShared<"x_i">>>,
    Expect<Equal<MathShared<"x_1">, LatexShared<"x_1">>>,
    Expect<Equal<MathShared<"a/b">, LatexShared<"\\frac{a}{b}">>>,
    Expect<Equal<MathShared<"sqrt(x)">, LatexShared<"\\sqrt{x}">>>,
    Expect<Equal<MathShared<"pi">, LatexShared<"\\pi">>>,
    Expect<Equal<MathShared<"a<=b">, LatexShared<"a \\le b">>>,
    Expect<Equal<MathShared<"(a+b)*c">, LatexShared<"(a+b) \\cdot c">>>
];

type Ns = "http://www.w3.org/1998/Math/MathML";
type OmmlNs = "http://schemas.openxmlformats.org/officeDocument/2006/math";

export type LatexToBothSinks = [
    Expect<Equal<Serialize<ToMathML<LatexShared<"\\frac{\\pi}{2}">>>, `<math xmlns="${Ns}"><mfrac><mi>π</mi><mn>2</mn></mfrac></math>`>>,
    Expect<Equal<
        Serialize<ToOmml<LatexShared<"\\frac{\\pi}{2}">>>,
        `<m:oMath xmlns:m="${OmmlNs}"><m:f><m:num><m:r><m:t>π</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath>`
    >>
];

const PAIRS: ReadonlyArray<readonly [string, string]> = [
    ["x^2", "x^2"],
    ["x_i", "x_i"],
    ["x_1", "x_1"],
    ["a/b", "\\frac{a}{b}"],
    ["sqrt(x)", "\\sqrt{x}"],
    ["pi", "\\pi"],
    ["a<=b", "a \\le b"],
    ["(a+b)*c", "(a+b) \\cdot c"]
];

test("math and latex converge on the same shared IR", () => {
    for (const [mathSource, latexSource] of PAIRS) {
        expect(lowerLatex(parseLatex(latexSource)))
            .toEqual(lowerMath(parseMath(mathSource)));
    }
});

test("both languages emit identical MathML and OMML through the shared IR", () => {
    for (const [mathSource, latexSource] of PAIRS) {
        expect(xml(toMathML(lowerLatex(parseLatex(latexSource))))).toBe(xml(toMathML(lowerMath(parseMath(mathSource)))));
        expect(xml(toOmml(lowerLatex(parseLatex(latexSource))))).toBe(xml(toOmml(lowerMath(parseMath(mathSource)))));
    }
});

test("latex reaches both sinks with its own glyphs", () => {
    const NS = "http://www.w3.org/1998/Math/MathML";
    const OMML_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";
    const shared = lowerLatex(parseLatex("\\frac{\\pi}{2}"));
    expect(xml(toMathML(shared))).toBe(`<math xmlns="${NS}"><mfrac><mi>π</mi><mn>2</mn></mfrac></math>`);
    expect(xml(toOmml(shared))).toBe(`<m:oMath xmlns:m="${OMML_NS}"><m:f><m:num><m:r><m:t>π</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath>`);
});
