import { test, expect } from "vitest";
import { chartMax, pickAccent, pieSlices } from "#/export/chart";
import { ChartKind } from "#/ir";
import type { ChartData } from "#/ir";

function chart(kind: ChartKind, categories: ReadonlyArray<string>, series: ReadonlyArray<{ name: string, values: ReadonlyArray<number> }>): ChartData {
    return { kind, categories, series } as ChartData;
}

test("chartMax rounds a bar chart up to a clean axis maximum", () => {
    // Tallest value 240 rounds up to 300.
    const data = chart(ChartKind.Bars, ["Jan", "Feb", "Mar"], [ { name: "A", values: [120, 240, 200] }, { name: "B", values: [90, 150, 180] } ]);
    expect(chartMax(data)).toBe(300);
});

test("chartMax of a stacked chart scales to the tallest column total, not the tallest single value", () => {
    // Column totals are 150 and 230 (-> 300); the tallest single value is only 110 (-> 200), so the two differ.
    const data = chart(ChartKind.Stacked, ["Q1", "Q2"], [
        { name: "A", values: [80, 110] },
        { name: "B", values: [40, 70] },
        { name: "C", values: [30, 50] }
    ]);
    expect(chartMax(data)).toBe(300);
});

test("chartMax of an all-zero chart is 1, never 0", () => {
    expect(chartMax(chart(ChartKind.Bars, ["x"], [ { name: "A", values: [0] } ]))).toBe(1);
});

test("pickAccent cycles through the palette by modulo", () => {
    const accents = ["a", "b", "c"] as const;
    expect(pickAccent(accents, 0)).toBe("a");
    expect(pickAccent(accents, 2)).toBe("c");
    expect(pickAccent(accents, 3)).toBe("a");
    expect(pickAccent(accents, 7)).toBe("b");
});

test("pieSlices produces cumulative fractions that span the whole circle", () => {
    const slices = pieSlices([60, 30, 10]);
    expect(slices.length).toBe(3);
    expect(slices[0].startFraction).toBe(0);
    expect(slices[0].endFraction).toBeCloseTo(0.6);
    expect(slices[1].startFraction).toBeCloseTo(0.6);
    expect(slices[2].endFraction).toBeCloseTo(1);
});

test("pieSlices clamps negatives and skips an all-zero or empty series", () => {
    expect(pieSlices([0, 0, 0])).toEqual([]);
    expect(pieSlices([])).toEqual([]);
    const clamped = pieSlices([-5, 10]);
    expect(clamped[0].endFraction).toBe(0);
    expect(clamped[1].endFraction).toBeCloseTo(1);
});

test("pieSlices draws a single non-zero value as a full circle", () => {
    expect(pieSlices([42])).toEqual([ { startFraction: 0, endFraction: 1 } ]);
});
