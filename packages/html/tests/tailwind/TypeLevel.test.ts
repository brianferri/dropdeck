import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "../../src/tailwind/Resolve.js";
import type { Tailwind } from "../../src/tailwind/Resolve.js";

// `Assertions` is exported so each `Expect` row counts as used.
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

export type Assertions = [
    Expect<Equal<Tailwind<"text-3xl gap-4">, { fontSize: "30px", gap: "16px" }>>,
    Expect<Equal<Tailwind<"text-cyan-700">, { color: "#0e7490" }>>,
    Expect<Equal<Tailwind<"border-orange-700">, { borderColor: "#c2410c" }>>,
    Expect<Equal<Tailwind<"border">, { borderWidth: "1px" }>>,
    Expect<Equal<Tailwind<"border-l-4">, { borderLeftWidth: "4px" }>>,
    Expect<Equal<Tailwind<"rounded-lg">, { borderRadius: "8px" }>>,
    Expect<Equal<Tailwind<"grid-cols-5">, { gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }>>,
    Expect<Equal<Tailwind<"col-span-2">, { gridColumn: "span 2 / span 2" }>>,
    Expect<Equal<Tailwind<"mt-6">, { marginTop: "24px" }>>,
    Expect<Equal<Tailwind<"px-4">, { paddingLeft: "16px", paddingRight: "16px" }>>,
    Expect<Equal<Tailwind<"text-center font-semibold italic">, { textAlign: "center", fontWeight: "600", fontStyle: "italic" }>>,
    Expect<Equal<keyof Tailwind<"totally-unknown">, never>>,
    Expect<Equal<Tailwind<string>, Record<string, string>>>
];

await test("type-level: the runtime resolve matches what Tailwind<S> computes", () => {
    assert.deepEqual(resolve("text-3xl gap-4"), { fontSize: "30px", gap: "16px" });
});
