import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, parseStyle } from "../../src/css/Parser.js";
import { serializeStyle } from "../../src/css/Serializer.js";
import type { Combinator, SelectorKind } from "../../src/css/Selector.js";
import { declarationValue, rules } from "../../src/css/Query.js";
import type { ParseStyle, ParseStylesheet } from "../../src/css/Parse.js";
import type { ParseSelector } from "../../src/css/ParseSelector.js";
import type { SerializeStyle } from "../../src/css/Serializer.js";
import type { Declaration, Stylesheet } from "../../src/css/Specification.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Style = ParseStyle<"color: red; font-size: 2rem">;
type Sheet = ParseStylesheet<".a { color: red }">;
type Selector = ParseSelector<"div > .b">;

export type Assertions = [
    Expect<Equal<Style[0]["property"], "color">>,
    Expect<Equal<Style[0]["value"], "red">>,
    Expect<Equal<Style[0]["important"], false>>,
    Expect<Equal<Style[1]["property"], "font-size">>,
    Expect<Equal<Style[1]["value"], "2rem">>,
    Expect<Equal<Sheet[0]["selectors"], readonly [".a"]>>,
    Expect<Equal<Sheet[0]["declarations"][0]["value"], "red">>,
    Expect<Equal<Selector[0]["compound"][0]["kind"], SelectorKind.Type>>,
    Expect<Equal<Selector[0]["compound"][0]["name"], "div">>,
    Expect<Equal<Selector[1]["combinator"], Combinator.Child>>,
    Expect<Equal<SerializeStyle<Style>, "color: red; font-size: 2rem">>,
    // A non-literal string widens to the general AST rather than a bogus tree.
    Expect<Equal<ParseStylesheet<string>, Stylesheet>>,
    Expect<Equal<ParseStyle<string>, ReadonlyArray<Declaration>>>
];

await test("type-level: a stylesheet literal parses and queries at runtime as its type asserts", () => {
    const sheet = parse(".a { color: red }");
    assert.equal(declarationValue(rules(sheet)[0], "color"), "red");
});

await test("type-level: an inline style round-trips at runtime", () => {
    assert.equal(serializeStyle(parseStyle("color: red; font-size: 2rem")), "color: red; font-size: 2rem");
});
