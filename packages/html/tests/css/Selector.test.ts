import { test } from "node:test";
import assert from "node:assert/strict";
import { Combinator, SelectorKind, parseSelector } from "../../src/css/Selector.js";

await test("parseSelector: a compound of type, class and id", () => {
    const steps = parseSelector("div.card#main");
    assert.equal(steps.length, 1);
    assert.equal(steps[0].combinator, Combinator.Descendant);
    assert.deepEqual(steps[0].compound, [
        { kind: SelectorKind.Type, name: "div" },
        { kind: SelectorKind.Class, name: "card" },
        { kind: SelectorKind.Id, name: "main" }
    ]);
});

await test("parseSelector: combinators between compounds", () => {
    const steps = parseSelector(".a > .b + .c ~ .d");
    assert.deepEqual(steps.map((step) => step.combinator), [
        Combinator.Descendant,
        Combinator.Child,
        Combinator.NextSibling,
        Combinator.SubsequentSibling
    ]);
    assert.equal(steps[1].compound[0].name, "b");
});

await test("parseSelector: descendant combinator from whitespace", () => {
    const steps = parseSelector("nav  ul li");
    assert.equal(steps.length, 3);
    assert.deepEqual(steps.map((step) => step.combinator), [Combinator.Descendant, Combinator.Descendant, Combinator.Descendant]);
});

await test("parseSelector: attribute and functional pseudo keep their inner text", () => {
    const [ { compound } ] = parseSelector("a[href^=\"http\"]:not(.x)::before");
    assert.deepEqual(compound[0], { kind: SelectorKind.Type, name: "a" });
    assert.deepEqual(compound[1], { kind: SelectorKind.Attribute, name: "href^=\"http\"" });
    assert.deepEqual(compound[2], { kind: SelectorKind.PseudoClass, name: "not(.x)" });
    assert.deepEqual(compound[3], { kind: SelectorKind.PseudoElement, name: "before" });
});

await test("parseSelector: universal selector", () => {
    const steps = parseSelector("*");
    assert.deepEqual(steps[0].compound, [ { kind: SelectorKind.Universal, name: "*" } ]);
});
