import { test, expect } from "vitest";
import { lowerLatex, lowerMath, toMathML, toOmml } from "#/formula";
import { parse as parseLatex } from "@dropdeck/latex";
import { parse as parseMath } from "@dropdeck/math";
import { xml } from "@dropdeck/xml";
import type { Expression, Parse } from "@dropdeck/math";
import type { Notation as LatexNotation, Parse as LatexParse } from "@dropdeck/latex";
import type { Serialize } from "@dropdeck/xml";
import type { LowerLatex, LowerMath, ToMathML, ToOmml } from "#/formula";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type MathAst<S extends string> = Extract<Parse<S>, Expression>;
type LatexAst<S extends string> = Extract<LatexParse<S>, LatexNotation>;

type MathToMathML<S extends string> = Serialize<ToMathML<LowerMath<MathAst<S>>>>;
type MathToOmml<S extends string> = Serialize<ToOmml<LowerMath<MathAst<S>>>>;
type LatexToMathML<S extends string> = Serialize<ToMathML<LowerLatex<LatexAst<S>>>>;
type LatexToOmml<S extends string> = Serialize<ToOmml<LowerLatex<LatexAst<S>>>>;

type Ns = "http://www.w3.org/1998/Math/MathML";
type Om = "http://schemas.openxmlformats.org/officeDocument/2006/math";

export type Rendered = [
    Expect<Equal<MathToMathML<"root(3, x)">, `<math xmlns="${Ns}"><mroot><mi>x</mi><mn>3</mn></mroot></math>`>>,
    Expect<Equal<LatexToMathML<"\\sqrt[3]{x}">, `<math xmlns="${Ns}"><mroot><mi>x</mi><mn>3</mn></mroot></math>`>>,
    Expect<Equal<
        MathToOmml<"root(3, x)">,
        `<m:oMath xmlns:m="${Om}"><m:rad><m:deg><m:r><m:t>3</m:t></m:r></m:deg><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad></m:oMath>`
    >>,
    Expect<Equal<MathToMathML<"int(a, b, f)">, `<math xmlns="${Ns}"><mrow><msubsup><mo>∫</mo><mi>a</mi><mi>b</mi></msubsup><mi>f</mi></mrow></math>`>>,
    Expect<Equal<MathToMathML<"int(f)">, `<math xmlns="${Ns}"><mrow><mo>∫</mo><mi>f</mi></mrow></math>`>>,
    Expect<Equal<MathToMathML<"lim(x, f)">, `<math xmlns="${Ns}"><mrow><munder><mo>lim</mo><mi>x</mi></munder><mi>f</mi></mrow></math>`>>,
    Expect<Equal<
        MathToOmml<"lim(x, f)">,
        `<m:oMath xmlns:m="${Om}"><m:func><m:fName><m:limLow><m:e><m:r><m:t>lim</m:t></m:r></m:e><m:lim><m:r><m:t>x</m:t></m:r></m:lim></m:limLow></m:fName><m:e><m:r><m:t>f</m:t></m:r></m:e></m:func></m:oMath>`
    >>
];
export type Parity = [
    Expect<Equal<MathToMathML<"root(3, x)">, LatexToMathML<"\\sqrt[3]{x}">>>,
    Expect<Equal<MathToOmml<"root(3, x)">, LatexToOmml<"\\sqrt[3]{x}">>>,
    Expect<Equal<MathToMathML<"int(a, b, f)">, LatexToMathML<"\\int_a^b f">>>,
    Expect<Equal<MathToOmml<"int(a, b, f)">, LatexToOmml<"\\int_a^b f">>>,
    Expect<Equal<MathToMathML<"lim(x, f)">, LatexToMathML<"\\lim_{x} f">>>,
    Expect<Equal<MathToOmml<"lim(x, f)">, LatexToOmml<"\\lim_{x} f">>>,
    Expect<Equal<MathToMathML<"limmax(x, f)">, LatexToMathML<"\\max_{x} f">>>,
    Expect<Equal<MathToMathML<"limsup(n, a)">, LatexToMathML<"\\limsup_{n} a">>>
];

function mathML<const Source extends string>(source: Source): MathToMathML<Source> {
    return xml(toMathML(lowerMath(parseMath(source) as MathAst<Source>)));
}
function latexML<const Source extends string>(source: Source): LatexToMathML<Source> {
    return xml(toMathML(lowerLatex(parseLatex(source) as LatexAst<Source>)));
}
function mathOmml<const Source extends string>(source: Source): MathToOmml<Source> {
    return xml(toOmml(lowerMath(parseMath(source) as MathAst<Source>)));
}
function latexOmml<const Source extends string>(source: Source): LatexToOmml<Source> {
    return xml(toOmml(lowerLatex(parseLatex(source) as LatexAst<Source>)));
}

test("nth root renders as a degreed radical, matching latex in both sinks", () => {
    expect(mathML("root(3, x)")).toContain("<mroot>");
    expect(mathML("root(3, x)")).toBe(latexML("\\sqrt[3]{x}"));
    expect(mathOmml("root(3, x)")).toBe(latexOmml("\\sqrt[3]{x}"));
});

test("a definite integral scripts its bounds beside the sign, matching latex", () => {
    expect(mathML("int(a, b, f)")).toContain("<msubsup>");
    expect(mathML("int(a, b, f)")).toBe(latexML("\\int_a^b f"));
    expect(mathOmml("int(a, b, f)")).toBe(latexOmml("\\int_a^b f"));
});

test("an indefinite integral drops its empty bounds to a bare sign", () => {
    // No `msub`/`msup` wrapper, so no empty script boxes -- just the operator and its body.
    expect(mathML("int(f)")).toContain("<mo>∫</mo><mi>f</mi>");
    expect(mathML("int(f)")).not.toContain("msub");
    expect(mathML("int(f)")).not.toContain("msup");
});

test("the contour, double, and triple integral signs", () => {
    expect(mathML("oint(f)")).toContain("<mo>∮</mo>");
    expect(mathML("iint(f)")).toContain("<mo>∬</mo>");
    expect(mathML("iiint(f)")).toContain("<mo>∭</mo>");
});

test("lim stacks its limit beneath the word and matches latex in both sinks", () => {
    expect(mathML("lim(x, f)")).toContain("<munder><mo>lim</mo><mi>x</mi></munder>");
    expect(mathOmml("lim(x, f)")).toContain("<m:limLow>");
    expect(mathML("lim(x, f)")).toBe(latexML("\\lim_{x} f"));
    expect(mathOmml("lim(x, f)")).toBe(latexOmml("\\lim_{x} f"));
});

test("the lim-family word operators each render as their own word", () => {
    expect(mathML("sup(x, f)")).toContain("<mo>sup</mo>");
    expect(mathML("inf(x, f)")).toContain("<mo>inf</mo>");
    expect(mathML("limsup(n, a)")).toContain("<mo>lim sup</mo>");
    expect(mathML("liminf(n, a)")).toContain("<mo>lim inf</mo>");
});

test("limmax/limmin are the max/min operator forms, matching latex's scripted max/min", () => {
    expect(mathML("limmax(x, f)")).toContain("<mo>max</mo>");
    expect(mathML("limmax(x, f)")).toBe(latexML("\\max_{x} f"));
    expect(mathML("limmin(x, f)")).toBe(latexML("\\min_{x} f"));
});

test("a bare latex max is an ordinary word, not a limit operator", () => {
    // `\max(a, b)` scripts nothing, so it stays the plain word applied to its argument -- no under-limit.
    expect(latexML("\\max(a,b)")).toContain("<mi>max</mi>");
    expect(latexML("\\max(a,b)")).not.toContain("munder");
});
