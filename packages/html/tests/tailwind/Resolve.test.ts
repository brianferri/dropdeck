import { test } from "node:test";
import assert from "node:assert/strict";
import { colorClass, columnSpan, gridColumns, resolve } from "../../src/tailwind/Resolve.js";
import { CssProperty } from "../../src/tailwind/Specification.js";

await test("resolve: sizes, spacing and a merge across classes", () => {
    assert.deepEqual(resolve("text-3xl gap-4"), { fontSize: "30px", gap: "16px" });
    assert.deepEqual(resolve("mt-6"), { marginTop: "24px" });
    assert.deepEqual(resolve("px-4"), { paddingLeft: "16px", paddingRight: "16px" });
});

await test("resolve: colours resolve to faithful Tailwind hexes", () => {
    assert.deepEqual(resolve("text-cyan-700"), { color: "#0e7490" });
    assert.deepEqual(resolve("bg-slate-50"), { backgroundColor: "#f8fafc" });
    assert.deepEqual(resolve("border-orange-700"), { borderColor: "#c2410c" });
});

await test("resolve: borders, radius, grid and flags", () => {
    assert.deepEqual(resolve("border"), { borderWidth: "1px" });
    assert.deepEqual(resolve("border-l-4"), { borderLeftWidth: "4px" });
    assert.deepEqual(resolve("rounded-lg"), { borderRadius: "8px" });
    assert.deepEqual(resolve("grid grid-cols-5"), { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" });
    assert.deepEqual(resolve("col-span-2"), { gridColumn: "span 2 / span 2" });
    assert.deepEqual(resolve("text-center font-semibold italic"), { textAlign: "center", fontWeight: "600", fontStyle: "italic" });
});

await test("resolve: later classes win and unknowns are ignored", () => {
    assert.deepEqual(resolve("p-2 p-4"), { padding: "16px" });
    assert.deepEqual(resolve("totally-unknown"), {});
    assert.deepEqual(resolve("  text-sm   italic  "), { fontSize: "14px", fontStyle: "italic" });
});

await test("structured helpers for a consumer's own theme mapping", () => {
    assert.deepEqual(colorClass("text-cyan-700"), { property: CssProperty.Color, family: "cyan", shade: "700", hex: "#0e7490" });
    assert.equal(colorClass("text-3xl"), null);
    assert.equal(gridColumns("grid-cols-5"), 5);
    assert.equal(gridColumns("col-span-2"), null);
    assert.equal(columnSpan("col-span-3"), 3);
});
