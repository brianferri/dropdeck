import { test } from "node:test";
import assert from "node:assert/strict";
import { Namespace } from "@dropdeck/oox";
import type { ParseQName, QName } from "@dropdeck/oox";
import type { CT_Point2D, CT_Transform2D, ValidateHexColor } from "../src/typings/drawingml.js";
import type { Equal, Expect } from "@dropdeck/common";

export type TypeLevelChecks = [
    Expect<Equal<QName<"a", "off">, "a:off">>,
    Expect<Equal<ParseQName<"a:off">, { readonly prefix: "a", readonly local: "off" }>>,
    Expect<Equal<ParseQName<"p:sld">, { readonly prefix: "p", readonly local: "sld" }>>,

    Expect<Equal<ValidateHexColor<"7BEFEB">, "7BEFEB">>,
    Expect<Equal<ValidateHexColor<"000000">, "000000">>,
    Expect<Equal<ValidateHexColor<"abcdef">, "abcdef">>,
    Expect<Equal<ValidateHexColor<"GGGGGG">, 'invalid hex colour "GGGGGG": each of 6 characters must be a hex digit'>>,
    Expect<Equal<ValidateHexColor<"7BEF">, 'invalid hex colour "7BEF": expected exactly 6 hex digits'>>,
    Expect<Equal<ValidateHexColor<"7BEFEBA">, 'invalid hex colour "7BEFEBA": each of 6 characters must be a hex digit'>>,

    Expect<Equal<CT_Point2D["tag"], "a:off">>,
    Expect<Equal<CT_Transform2D["tag"], "a:xfrm">>
];

await test("Specification: namespace registry", async (ctx) => {
    await ctx.test("each vocabulary resolves to its ECMA-376 namespace URI", () => {
        assert.equal(Namespace.DrawingML, "http://schemas.openxmlformats.org/drawingml/2006/main");
        assert.equal(Namespace.PresentationML, "http://schemas.openxmlformats.org/presentationml/2006/main");
    });
});
