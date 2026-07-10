import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, serialize } from "../src/index.js";
import type { Expression, Parse, Serialize } from "../src/index.js";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

// `Serialize<Parse<S>>` proves the round-trip at `tsc` time -- same precedence and associativity as the runtime.
export type Checks = [
    Assert<Equal<Serialize<Parse<"a + b * c">>, "a + b * c">>,
    Assert<Equal<Serialize<Parse<"(a + b) * c">>, "(a + b) * c">>,
    Assert<Equal<Serialize<Parse<"a - (b - c)">>, "a - (b - c)">>,
    Assert<Equal<Serialize<Parse<"a ^ b ^ c">>, "a ^ b ^ c">>,
    Assert<Equal<Serialize<Parse<"(a ^ b) ^ c">>, "(a ^ b) ^ c">>,
    Assert<Equal<Serialize<Parse<"-(a + b)">>, "-(a + b)">>,
    Assert<Equal<Serialize<Parse<"not a and b">>, "not a and b">>,
    Assert<Equal<Serialize<Parse<"sqrt(a, b)">>, "sqrt(a, b)">>,

    // Redundant parentheses are dropped, exactly as the runtime serializer drops them.
    Assert<Equal<Serialize<Parse<"(a * b) + c">>, "a * b + c">>,
    Assert<Equal<Serialize<Parse<"a + (b * c)">>, "a + b * c">>
];

function roundTrip<Source extends string>(source: Source): Serialize<Parse<Source> & Expression> {
    return serialize(parse(source) as Parse<Source> & Expression);
}

await test("serialize round-trips a canonically spaced source", () => {
    assert.equal(roundTrip("a + b * c"), "a + b * c");
    assert.equal(roundTrip("sqrt(a, b)"), "sqrt(a, b)");
    assert.equal(roundTrip("not a and b"), "not a and b");
    assert.equal(roundTrip("3.5 * pi"), "3.5 * pi");
});

await test("serialize keeps the parentheses precedence and associativity require", () => {
    assert.equal(roundTrip("(a + b) * c"), "(a + b) * c");
    assert.equal(roundTrip("a - (b - c)"), "a - (b - c)");
    assert.equal(roundTrip("(a ^ b) ^ c"), "(a ^ b) ^ c");
    assert.equal(roundTrip("-(a + b)"), "-(a + b)");
});

await test("serialize drops redundant parentheses", () => {
    assert.equal(roundTrip("(a * b) + c"), "a * b + c");
    assert.equal(roundTrip("a + (b * c)"), "a + b * c");
    assert.equal(roundTrip("a ^ (b ^ c)"), "a ^ b ^ c");
    assert.equal(roundTrip("a - b - c"), "a - b - c");
});
