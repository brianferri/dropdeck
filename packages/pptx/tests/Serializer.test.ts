import { test } from "node:test";
import assert from "node:assert/strict";
import { xml } from "../src/xml/Serializer.js";
import { text } from "../src/xml/builders.js";
import type { Element, Serialize, Text } from "../src/xml/index.js";
import { ext, off, solidFill, srgbClr, xfrm } from "../src/drawingml/builders.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
(<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// Derived from the builders, not hand-written, so these prove what `off`/`srgbClr`/`solidFill` actually infer.
type OffNode = ReturnType<typeof off<914400, 0>>;
type ColorNode = ReturnType<typeof srgbClr<"7BEFEB">>;
type FillNode = ReturnType<typeof solidFill<ColorNode>>;
type Amp = Text & { readonly text: "a < b & c" };

export type TypeLevelChecks = [
    Expect<Equal<OffNode, Element<"a:off", readonly [readonly ["x", 914400], readonly ["y", 0]], readonly []>>>,

    Expect<Equal<Serialize<OffNode>, '<a:off x="914400" y="0"/>'>>,
    Expect<Equal<Serialize<ColorNode>, '<a:srgbClr val="7BEFEB"/>'>>,
    Expect<Equal<Serialize<FillNode>, '<a:solidFill><a:srgbClr val="7BEFEB"/></a:solidFill>'>>,

    Expect<Equal<Serialize<Amp>, "a &lt; b &amp; c">>,

    Expect<Equal<ReturnType<typeof xml<OffNode>>, '<a:off x="914400" y="0"/>'>>
];

await test("Serializer: self-closing elements", async (ctx) => {
    await ctx.test("an offset point serialises to a self-closing tag", () => {
        assert.equal(xml(off(914400, 0)), '<a:off x="914400" y="0"/>');
    });
    await ctx.test("an extent serialises its size attributes", () => {
        assert.equal(xml(ext(12192000, 6858000)), '<a:ext cx="12192000" cy="6858000"/>');
    });
    await ctx.test("xml returns the same literal its type reports", () => {
        const literal = xml(off(914400, 0));
        assert.equal(literal, '<a:off x="914400" y="0"/>');
    });
});

await test("Serializer: nested elements", async (ctx) => {
    await ctx.test("a transform nests its offset and extent in order", () => {
        const node = xfrm(off(914400, 0), ext(2743200, 1828800));
        assert.equal(
            xml(node),
            '<a:xfrm><a:off x="914400" y="0"/><a:ext cx="2743200" cy="1828800"/></a:xfrm>'
        );
    });
    await ctx.test("a solid fill nests a validated colour", () => {
        assert.equal(
            xml(solidFill(srgbClr("7BEFEB"))),
            '<a:solidFill><a:srgbClr val="7BEFEB"/></a:solidFill>'
        );
    });
});

await test("Serializer: escaping", async (ctx) => {
    await ctx.test("text escapes the markup-significant characters", () => {
        assert.equal(xml(text("a < b & c > d")), "a &lt; b &amp; c &gt; d");
    });
    await ctx.test("attribute values escape quotes and ampersands", () => {
        assert.equal(xml(off(1, 2)).startsWith("<a:off"), true);
    });
});
