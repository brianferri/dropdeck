import { test } from "node:test";
import assert from "node:assert/strict";
import { invert } from "../src/index.js";
import type { DigitChar, LeadN, LongestRule, Step } from "../src/index.js";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

// A neutral longest-match table: three keys share a prefix, so which width wins is observable.
type Table = { a: "one", aa: "two", aaa: "three" };

export type Leads = [
    Assert<Equal<LeadN<"1x", DigitChar, 1>, { head: "1", rest: "x" }>>,
    Assert<Equal<LeadN<"x1", DigitChar, 1>, false>>,
    Assert<Equal<LeadN<"", DigitChar, 1>, false>>,
    Assert<Equal<LeadN<"aab", "aa" | "bb", 2>, { head: "aa", rest: "b" }>>,
    Assert<Equal<LeadN<"abx", "aa" | "bb", 2>, false>>,
    Assert<Equal<LeadN<"a", "aa" | "bb", 2>, false>>
];

// `LongestRule` emits the widest keying prefix as a token, and never scans past `Width` characters.
export type Longest = [
    Assert<Equal<LongestRule<"aaax", Table, 3>, Step<["three"], "x">>>,
    Assert<Equal<LongestRule<"aax", Table, 3>, Step<["two"], "x">>>,
    Assert<Equal<LongestRule<"ax", Table, 3>, Step<["one"], "x">>>,
    Assert<Equal<LongestRule<"aaax", Table, 1>, Step<["one"], "aax">>>,
    Assert<Equal<LongestRule<"zx", Table, 3>, false>>
];

// `invert` keys a map by its values; the value type is a generic `PropertyKey`, mirroring how the glyph tables
// invert an enum-keyed, string-valued map into a glyph-keyed one.
const wordReverse = invert({ north: "up", south: "down" });
export type Inversions = [
    Assert<Equal<typeof wordReverse, { readonly up: "north", readonly down: "south" }>>
];

await test("invert produces the reverse map at runtime, matching its inferred type", () => {
    assert.deepEqual(invert({ north: "up", south: "down" }), { up: "north", down: "south" });
});
