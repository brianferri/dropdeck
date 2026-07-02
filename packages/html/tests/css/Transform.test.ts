import { test } from "node:test";
import assert from "node:assert/strict";
import { parseValue, serializeValue } from "../../src/css/Value.js";
import { parseTransform, serializeTransform } from "../../src/css/Transform.js";
import { decompose, matrixOf } from "../../src/css/Matrix.js";
import { CssValueKind } from "../../src/css/Specification.js";
import { dimension, functionValue, separator } from "../../src/css/builders.js";
import type { ParseValue, SerializeValue } from "../../src/css/Value.js";
import type { SerializeTransform } from "../../src/css/Transform.js";
import type { Dimension, FunctionValue, Percentage, Separator } from "../../src/css/Specification.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Move = FunctionValue<"translate", readonly [Dimension<"300", "px">, Separator<",">, Separator<" ">, Dimension<"55", "px">]>;
type Spin = FunctionValue<"rotate", readonly [Dimension<"14", "deg">]>;

const built = [functionValue("translate", [dimension("300", "px"), separator(","), separator(" "), dimension("55", "px")])] as const;

export type Assertions = [
    Expect<Equal<SerializeValue<readonly [Move]>, "translate(300px, 55px)">>,
    Expect<Equal<SerializeTransform<readonly [Move, Spin]>, "translate(300px, 55px) rotate(14deg)">>,
    Expect<Equal<SerializeValue<typeof built>, "translate(300px, 55px)">>,
    Expect<Equal<ParseValue<"translate(300px, 55px)">, readonly [Move]>>,
    Expect<Equal<ParseValue<"14deg">, readonly [Dimension<"14", "deg">]>>,
    Expect<Equal<ParseValue<"-50%">, readonly [Percentage<"-50">]>>,
    Expect<Equal<SerializeValue<ParseValue<"translate(300px, 55px) rotate(14deg) scale(1.05)">>, "translate(300px, 55px) rotate(14deg) scale(1.05)">>
];

await test("value: a component-value list round-trips through parse and serialize", () => {
    const value = "translate(300px, 55px) rotate(14deg) scale(1.05)";
    assert.equal(serializeValue(parseValue(value)), value);
});

await test("builders: a value built from the component-value builders serialises to its exact string", () => {
    assert.equal(serializeValue(built), "translate(300px, 55px)");
});

await test("value: a dimension keeps its number and unit apart", () => {
    const values = parseValue("14deg");
    assert.equal(values[0].kind, CssValueKind.Dimension);
    assert.deepEqual(values[0], { kind: CssValueKind.Dimension, value: "14", unit: "deg" });
});

await test("transform: reads the function component-values of a value", () => {
    const functions = parseTransform("translate(30px, 0) rotate(90deg)");
    assert.equal(functions.length, 2);
    assert.equal(functions[0].name, "translate");
    assert.equal(serializeTransform(functions), "translate(30px, 0) rotate(90deg)");
});

await test("transform: rotate and scale compose then decompose to their parts", () => {
    const parts = decompose(matrixOf(parseTransform("rotate(90deg) scale(2)")));
    assert.equal(Math.round(parts.rotateDeg), 90);
    assert.equal(Math.round(parts.scaleX), 2);
    assert.equal(Math.round(parts.scaleY), 2);
});

await test("transform: a translation lands in the matrix offset", () => {
    const parts = decompose(matrixOf(parseTransform("translate(30px, -12px)")));
    assert.equal(Math.round(parts.translateXPx), 30);
    assert.equal(Math.round(parts.translateYPx), -12);
});
