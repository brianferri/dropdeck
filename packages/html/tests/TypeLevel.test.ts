import { test } from "node:test";
import assert from "node:assert/strict";
import { element, text } from "../src/builders.js";
import { parse } from "../src/Parser.js";
import { serialize } from "../src/Serializer.js";
import type { Parse } from "../src/typings/parse.js";
import type { Serialize } from "../src/typings/serialize.js";
import type { Content, ElementNode, TextNode } from "../src/typings/nodes.js";

// `Expect<Equal<A, B>>` fails to typecheck unless A and B are identical.
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Built = ReturnType<typeof sampleTree>;
function sampleTree(): ElementNode<"div", readonly [readonly ["id", "a"]], readonly [ElementNode<"p", readonly [], readonly [TextNode & { readonly text: "hi" }]>]> {
    return element("div", [["id", "a"]], [element("p", [], [text("hi")])]);
}

type ParsedSimple = Parse<"<div id=\"a\"><p>hi</p></div>">;
type ParsedVoid = Parse<"<br>">;

export type Assertions = [
    Expect<Equal<Serialize<Built>, "<div id=\"a\"><p>hi</p></div>">>,
    Expect<Equal<Serialize<ElementNode<"br", readonly [], readonly []>>, "<br>">>,
    Expect<Equal<Serialize<TextNode & { readonly text: "a < b" }>, "a &lt; b">>,
    Expect<Equal<Serialize<ElementNode<"script", readonly [], readonly [TextNode & { readonly text: "a < b" }]>>, "<script>a < b</script>">>,
    Expect<Equal<Serialize<ElementNode<"title", readonly [], readonly [TextNode & { readonly text: "a < b" }]>>, "<title>a &lt; b</title>">>,
    Expect<Equal<ParsedSimple[0]["tag"], "div">>,
    Expect<Equal<ParsedSimple[0]["attrs"], readonly [readonly ["id", "a"]]>>,
    Expect<Equal<ParsedSimple[0]["children"][0]["tag"], "p">>,
    Expect<Equal<ParsedVoid[0]["tag"], "br">>,
    Expect<Equal<ParsedVoid[0]["children"], readonly []>>,
    Expect<Equal<Parse<string>, Content>>
];

await test("type-level: parse and serialize round-trip a literal at runtime", () => {
    const markup = "<div id=\"a\"><p>hi</p></div>";
    assert.equal(serialize(parse(markup)[0]), markup);
});

await test("type-level: serialize of a built tree equals the literal the type computes", () => {
    assert.equal(serialize(sampleTree()), "<div id=\"a\"><p>hi</p></div>");
});
