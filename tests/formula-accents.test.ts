import { test, expect } from "vitest";
import { lowerLatex, lowerMath, toMathML, toOmml } from "#/formula";
import { parse as parseLatex } from "@dropdeck/latex";
import { parse as parseMath } from "@dropdeck/math";
import { xml } from "@dropdeck/xml";
import type { Parse as ParseLatex, Notation as LatexNotation } from "@dropdeck/latex";
import type { AccentNode, IdentifierNode, LowerLatex, One, AccentKind } from "#/formula";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
type Lower<S extends string> = ParseLatex<S> extends infer N extends LatexNotation ? LowerLatex<N> : never;

// The package's accent command lowers to the shared IR's `AccentNode`, narrowing `"hat"` to the enum member.
export type AccentLowering = [
    Expect<Equal<Lower<"\\hat{x}">, AccentNode<AccentKind.Hat, One<IdentifierNode<"x">>>>>,
    Expect<Equal<Lower<"\\vec{F}">, AccentNode<AccentKind.Vec, One<IdentifierNode<"F">>>>>
];

test("an accent stacks its mark over the base as a MathML over-script", () => {
    expect(xml(toMathML(lowerLatex(parseLatex("\\hat{x}"))))).toBe("<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mover accent=\"true\"><mi>x</mi><mo>^</mo></mover></math>");
});

test("an accent lowers to a native OMML combining mark, and math reaches it through the same shared IR", () => {
    const omml = xml(toOmml(lowerLatex(parseLatex("\\hat{x}"))));
    expect(omml).toContain("<m:acc><m:accPr><m:chr m:val=\"̂\"/></m:accPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:acc>");
    expect(xml(toOmml(lowerMath(parseMath("hat(x)"))))).toBe(omml);
});
