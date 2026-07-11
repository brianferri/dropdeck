import { test, expect } from "vitest";
import { parse } from "@dropdeck/math";
import { xml } from "@dropdeck/xml";
import { lowerMath, toOmml } from "#/formula";
import type { Expression, Parse } from "@dropdeck/math";
import type { Serialize } from "@dropdeck/xml";
import type { LowerMath, ToOmml } from "#/formula";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Ns = "http://schemas.openxmlformats.org/officeDocument/2006/math";
type Render<S extends string> = Parse<S> extends infer E extends Expression ? Serialize<ToOmml<LowerMath<E>>> : never;

export type Rendered = [
    Expect<Equal<Render<"a/b">, `<m:oMath xmlns:m="${Ns}"><m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f></m:oMath>`>>,
    Expect<Equal<Render<"x_i">, `<m:oMath xmlns:m="${Ns}"><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub></m:oMath>`>>,
    Expect<Equal<Render<"x^2">, `<m:oMath xmlns:m="${Ns}"><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath>`>>,
    Expect<Equal<Render<"sqrt(x)">, `<m:oMath xmlns:m="${Ns}"><m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad></m:oMath>`>>,
    Expect<Equal<
        Render<"(a+b)*c">,
        `<m:oMath xmlns:m="${Ns}"><m:r><m:t>(</m:t></m:r><m:r><m:t>a</m:t></m:r><m:r><m:t>+</m:t></m:r><m:r><m:t>b</m:t></m:r><m:r><m:t>)</m:t></m:r><m:r><m:t>·</m:t></m:r><m:r><m:t>c</m:t></m:r></m:oMath>`
    >>
];

const NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";

test("the runtime pipeline serializes the same OMML the types compute", () => {
    expect(xml(toOmml(lowerMath(parse("a/b"))))).toBe(`<m:oMath xmlns:m="${NS}"><m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f></m:oMath>`);
    expect(xml(toOmml(lowerMath(parse("x_i"))))).toBe(`<m:oMath xmlns:m="${NS}"><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>i</m:t></m:r></m:sub></m:sSub></m:oMath>`);
    expect(xml(toOmml(lowerMath(parse("sqrt(x)"))))).toBe(`<m:oMath xmlns:m="${NS}"><m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad></m:oMath>`);
    const product = `<m:oMath xmlns:m="${NS}"><m:r><m:t>(</m:t></m:r><m:r><m:t>a</m:t></m:r><m:r><m:t>+</m:t></m:r>`
        + "<m:r><m:t>b</m:t></m:r><m:r><m:t>)</m:t></m:r><m:r><m:t>·</m:t></m:r><m:r><m:t>c</m:t></m:r></m:oMath>";
    expect(xml(toOmml(lowerMath(parse("(a+b)*c"))))).toBe(product);
});
