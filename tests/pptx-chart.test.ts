import { test, expect } from "vitest";
import { lowerChart } from "#/export/pptx/chart";
import { idFactory, relFactory } from "#/export/pptx/build";
import { resolvePalette } from "#/export/pptx/palette";
import { Motion } from "#/animations/spec";
import { ChartKind } from "#/ir";
import type { Embed } from "#/export/pptx/lower";
import type { ChartData } from "#/ir";

function embed(): Embed {
    return { nextId: idFactory(), nextRelId: relFactory(), palette: resolvePalette({}), assets: new Map<string, string>(), svgPngs: new Map<string, string>() };
}

function chart(kind: ChartKind, categories: ReadonlyArray<string>, series: ReadonlyArray<{ name: string, values: ReadonlyArray<number> }>): ChartData {
    return { kind, categories, series } as ChartData;
}

test("a grouped bar chart animates each bar with a wipe-up", () => {
    const data = chart(ChartKind.Bars, ["Jan", "Feb"], [ { name: "A", values: [1, 2] }, { name: "B", values: [3, 4] } ]);
    const { anim } = lowerChart(data, embed(), 0, 0, 800);
    expect(anim.length).toBe(4);
    expect(anim.every((ref) => ref.kind === Motion.WipeUp)).toBe(true);
});

test("a stacked chart animates one group per column, not one per segment", () => {
    const data = chart(ChartKind.Stacked, ["Q1", "Q2"], [
        { name: "A", values: [1, 2] },
        { name: "B", values: [3, 4] },
        { name: "C", values: [5, 6] }
    ]);
    const { anim } = lowerChart(data, embed(), 0, 0, 800);
    // Grouped: one ref per column (2), not one per segment (2 x 3 = 6).
    expect(anim.length).toBe(2);
    expect(anim.every((ref) => ref.kind === Motion.WipeUp)).toBe(true);
    expect(anim[0].shapes.length).toBe(1); // the ref targets the column group, a single shape
});

test("a pie chart sweeps its whole group with a single wheel", () => {
    const data = chart(ChartKind.Pie, ["Mobile", "Desktop", "Tablet"], [ { name: "Share", values: [60, 30, 10] } ]);
    const { anim } = lowerChart(data, embed(), 0, 0, 800);
    expect(anim.length).toBe(1);
    expect(anim[0].kind).toBe(Motion.Wheel);
});

test("a line chart wipes each series on left-to-right", () => {
    const data = chart(ChartKind.Line, ["Jan", "Feb", "Mar"], [ { name: "A", values: [1, 2, 3] }, { name: "B", values: [4, 5, 6] } ]);
    const { anim } = lowerChart(data, embed(), 0, 0, 800);
    expect(anim.length).toBe(2);
    expect(anim.every((ref) => ref.kind === Motion.Wipe)).toBe(true);
});
