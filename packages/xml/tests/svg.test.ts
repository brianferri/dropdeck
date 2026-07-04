import { test } from "node:test";
import assert from "node:assert/strict";
import { text, xml } from "../src/index.js";
import { circle, g, path, rect, svg, svgText, SVG_NS } from "../src/svg/index.js";
import type { Serialize } from "../src/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

const dot = circle([["cx", 40], ["cy", 40], ["r", 20], ["fill", "red"]]);
const box = rect([["x", 0], ["y", 0], ["width", 100], ["height", 50]]);
const chart = svg(
    [["viewBox", "0 0 100 100"], ["xmlns", SVG_NS]],
    g(
        [["transform", "translate(10,10)"]],
        path([["d", "M0 0 L10 10"], ["stroke", "black"]]),
        svgText([["x", 5], ["y", 5]], text("hi"))
    )
);

// The expected markup is a single source of truth: the type-level assertion checks `Serialize` computes it, and
// the runtime test checks the serializer emits it -- so the compile-time and runtime halves cannot drift.
const dotMarkup = "<circle cx=\"40\" cy=\"40\" r=\"20\" fill=\"red\"/>";
const boxMarkup = "<rect x=\"0\" y=\"0\" width=\"100\" height=\"50\"/>";
const chartMarkup =
    "<svg viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"><g transform=\"translate(10,10)\"><path d=\"M0 0 L10 10\" stroke=\"black\"/><text x=\"5\" y=\"5\">hi</text></g></svg>";

export type Assertions = [
    Expect<Equal<Serialize<typeof dot>, typeof dotMarkup>>,
    Expect<Equal<Serialize<typeof box>, typeof boxMarkup>>,
    Expect<Equal<Serialize<typeof chart>, typeof chartMarkup>>
];

await test("svg: a childless element self-closes and its attributes serialise", () => {
    assert.equal(xml(dot), dotMarkup);
});

await test("svg: numeric attributes coerce to strings", () => {
    assert.equal(xml(box), boxMarkup);
});

await test("svg: a nested tree serialises with a text label and a root xmlns", () => {
    assert.equal(xml(chart), chartMarkup);
});
