import { test, expect } from "vitest";
import { lowerLatex, lowerMath, toOmml } from "#/formula";
import { parse as parseLatex } from "@dropdeck/latex";
import { parse as parseMath } from "@dropdeck/math";
import { xml } from "@dropdeck/xml";
import type { Equal, Expect } from "@dropdeck/common";
import type { LowerLatex, LowerMath, ToOmml } from "#/formula";
import type { Expression, Parse } from "@dropdeck/math";
import type { Notation as LatexNotation, Parse as LatexParse } from "@dropdeck/latex";
import type { Serialize } from "@dropdeck/xml";

type MathAst<S extends string> = Extract<Parse<S>, Expression>;
type LatexAst<S extends string> = Extract<LatexParse<S>, LatexNotation>;
type MathToOmml<S extends string> = Serialize<ToOmml<LowerMath<MathAst<S>>>>;
type LatexToOmml<S extends string> = Serialize<ToOmml<LowerLatex<LatexAst<S>>>>;

type Om = "http://schemas.openxmlformats.org/officeDocument/2006/math";
type Dml = "http://schemas.openxmlformats.org/drawingml/2006/main";

// The OMML twin injects exactly the run properties the runtime does, so the two never drift.
export type Rendered = [
    Expect<Equal<MathToOmml<"bold(x)">, `<m:oMath xmlns:m="${Om}"><m:r><m:rPr><m:sty m:val="b"/></m:rPr><m:t>x</m:t></m:r></m:oMath>`>>,
    Expect<Equal<MathToOmml<"bb(R)">, `<m:oMath xmlns:m="${Om}"><m:r><m:rPr><m:scr m:val="double-struck"/></m:rPr><m:t>R</m:t></m:r></m:oMath>`>>,
    Expect<Equal<MathToOmml<"color(red, E)">, `<m:oMath xmlns:m="${Om}"><m:r><a:rPr xmlns:a="${Dml}"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></a:rPr><m:t>E</m:t></m:r></m:oMath>`>>
];

export type Parity = [
    Expect<Equal<MathToOmml<"bold(x)">, LatexToOmml<"\\mathbf{x}">>>,
    Expect<Equal<MathToOmml<"bb(R)">, LatexToOmml<"\\mathbb{R}">>>,
    Expect<Equal<MathToOmml<"color(red, E)">, LatexToOmml<"\\textcolor{red}{E}">>>
];

function mathOmml<const Source extends string>(source: Source): MathToOmml<Source> {
    return xml(toOmml(lowerMath(parseMath(source) as MathAst<Source>)));
}

function latexOmml<const Source extends string>(source: Source): LatexToOmml<Source> {
    return xml(toOmml(lowerLatex(parseLatex(source) as LatexAst<Source>)));
}

test("a font variant lowers to m:sty/m:scr run properties, matching the latex command", () => {
    expect(mathOmml("bold(x)")).toBe(latexOmml("\\mathbf{x}"));
    expect(mathOmml("bb(R)")).toBe(latexOmml("\\mathbb{R}"));
    expect(latexOmml("\\mathcal{L}")).toBe(mathOmml("cal(L)"));
});

test("a color lowers to a w:color run property, matching the latex command", () => {
    expect(mathOmml("color(red, E)")).toBe(latexOmml("\\textcolor{red}{E}"));
});

test("a styled group carries its run properties onto every run it wraps", () => {
    expect(mathOmml("color(blue, x + y)")).toBe(latexOmml("\\textcolor{blue}{x + y}"));
});
