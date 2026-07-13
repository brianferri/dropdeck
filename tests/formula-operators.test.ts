import { test, expect } from "vitest";
import { lowerLatex, lowerMath, toMathML, toOmml } from "#/formula";
import { parse } from "@dropdeck/latex";
import { parse as parseMath } from "@dropdeck/math";
import { xml } from "@dropdeck/xml";

function render(source: string): string {
    return xml(toMathML(lowerLatex(parse(source)))).replace(/^<math[^>]*>|<\/math>$/g, "");
}

test("logic and set commands lower to their operator glyphs", () => {
    const cases: ReadonlyArray<readonly [string, string]> = [
        ["\\forall", "∀"],
        ["\\exists", "∃"],
        ["\\neg", "¬"],
        ["\\wedge", "∧"],
        ["\\vee", "∨"],
        ["\\Rightarrow", "⇒"],
        ["\\Leftrightarrow", "⇔"],
        ["\\implies", "⟹"],
        ["\\iff", "⟺"],
        ["\\oplus", "⊕"],
        ["\\subset", "⊂"],
        ["\\subseteq", "⊆"],
        ["\\supseteq", "⊇"],
        ["\\notin", "∉"],
        ["\\setminus", "∖"],
        ["\\emptyset", "∅"],
        ["\\top", "⊤"],
        ["\\bot", "⊥"]
    ];
    for (const [source, glyph] of cases) expect(render(source)).toBe(`<mo>${glyph}</mo>`);
});

test("a logic statement renders each operator between its identifiers", () => {
    expect(render("\\forall x \\in S")).toBe("<mrow><mo>∀</mo><mi>x</mi><mo>∈</mo><mi>S</mi></mrow>");
});

test("a summation places its limits under and over the operator, with the term as its operand", () => {
    expect(render("\\sum_{i=1}^{n} i^2")).toBe("<mrow><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msup><mi>i</mi><mn>2</mn></msup></mrow>");
});

test("a math summation lowers to a native OMML n-ary through the same shared IR as latex", () => {
    const omml = xml(toOmml(lowerMath(parseMath("sum(i, 1, n, i^2)"))));
    expect(omml).toContain("<m:nary><m:naryPr><m:chr m:val=\"∑\"/><m:limLoc m:val=\"undOvr\"/></m:naryPr>");
    expect(omml).toBe(xml(toOmml(lowerLatex(parse("\\sum_{i=1}^{n} i^2")))));
});
