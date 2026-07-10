import { test, expect } from "vitest";
import { parse } from "@dropdeck/math";
import { xml } from "@dropdeck/xml";
import { lowerMath, toMathML } from "#/formula";
import type { Expression, Parse } from "@dropdeck/math";
import type { Serialize } from "@dropdeck/xml";
import type { LowerMath, ToMathML } from "#/formula";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Ns = "http://www.w3.org/1998/Math/MathML";
type Render<S extends string> = Parse<S> extends infer E extends Expression ? Serialize<ToMathML<LowerMath<E>>> : never;

// The whole pipeline as one type: math source -> parse -> lower -> MathML element -> serialized string.
export type Rendered = [
    Expect<Equal<Render<"x_i">, `<math xmlns="${Ns}"><msub><mi>x</mi><mi>i</mi></msub></math>`>>,
    Expect<Equal<Render<"a/b">, `<math xmlns="${Ns}"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>`>>,
    Expect<Equal<Render<"x^2">, `<math xmlns="${Ns}"><msup><mi>x</mi><mn>2</mn></msup></math>`>>,
    Expect<Equal<Render<"sqrt(x)">, `<math xmlns="${Ns}"><msqrt><mi>x</mi></msqrt></math>`>>,
    // A `<` operator glyph must be escaped in the `<mo>` text content, not emitted as raw markup.
    Expect<Equal<Render<"a<b">, `<math xmlns="${Ns}"><mrow><mi>a</mi><mo>&lt;</mo><mi>b</mi></mrow></math>`>>,
    // The fence the lowering re-inserted becomes stretchy `<mo>` parens around the inner row.
    Expect<Equal<
        Render<"(a+b)*c">,
        `<math xmlns="${Ns}"><mrow><mrow><mo>(</mo><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo>)</mo></mrow><mo>·</mo><mi>c</mi></mrow></math>`
    >>
];

const NS = "http://www.w3.org/1998/Math/MathML";

test("the runtime pipeline serializes the same MathML the types compute", () => {
    expect(xml(toMathML(lowerMath(parse("x_i"))))).toBe(`<math xmlns="${NS}"><msub><mi>x</mi><mi>i</mi></msub></math>`);
    expect(xml(toMathML(lowerMath(parse("a/b"))))).toBe(`<math xmlns="${NS}"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>`);
    expect(xml(toMathML(lowerMath(parse("sqrt(x)"))))).toBe(`<math xmlns="${NS}"><msqrt><mi>x</mi></msqrt></math>`);
    expect(xml(toMathML(lowerMath(parse("a<b"))))).toBe(`<math xmlns="${NS}"><mrow><mi>a</mi><mo>&lt;</mo><mi>b</mi></mrow></math>`);
    expect(xml(toMathML(lowerMath(parse("(a+b)*c"))))).toBe(`<math xmlns="${NS}"><mrow><mrow><mo>(</mo><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo>)</mo></mrow><mo>·</mo><mi>c</mi></mrow></math>`);
});
