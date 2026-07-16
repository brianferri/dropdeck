import { test, expect } from "vitest";
import { lowerLatex, lowerMath, toMathML, toOmml } from "#/formula";
import { parse as parseLatex } from "@dropdeck/latex";
import { parse as parseMath } from "@dropdeck/math";
import { xml } from "@dropdeck/xml";

function mathML(source: string): string {
    return xml(toMathML(lowerMath(parseMath(source))));
}
function latexML(source: string): string {
    return xml(toMathML(lowerLatex(parseLatex(source))));
}
function mathOmml(source: string): string {
    return xml(toOmml(lowerMath(parseMath(source))));
}
function latexOmml(source: string): string {
    return xml(toOmml(lowerLatex(parseLatex(source))));
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
