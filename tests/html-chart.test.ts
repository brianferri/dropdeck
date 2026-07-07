import { test, expect } from "vitest";
import { renderBlock } from "#/export/html";
import { serialize } from "#/dom";
import { BlockKind, ChartKind } from "#/ir";
import type { Block, ChartData } from "#/ir";

function render(kind: ChartKind, categories: ReadonlyArray<string>, series: ReadonlyArray<{ name: string, values: ReadonlyArray<number> }>): string {
    const block = { kind: BlockKind.Chart, chart: { kind, categories, series } as ChartData } as Block;
    return serialize(renderBlock(block));
}

function count(haystack: string, needle: string): number {
    return haystack.split(needle).length - 1;
}

test("a bar chart renders a reveal panel of bars, each tagged for the grow animation", () => {
    const out = render(ChartKind.Bars, ["Jan", "Feb"], [ { name: "A", values: [1, 2] } ]);
    expect(out).toContain("panel chart");
    expect(out).toContain("data-animation=\"reveal\"");
    expect(out).toContain("class=\"chart-bar\"");
    expect(out).toContain("chart-legend");
    expect(count(out, "data-animation=\"chart-grow\"")).toBe(2);
});

test("a stacked chart tags the whole column once, not each segment", () => {
    const out = render(ChartKind.Stacked, ["Q1"], [ { name: "A", values: [1] }, { name: "B", values: [2] } ]);
    expect(out).toContain("chart-col chart-stack");
    expect(out).toContain("chart-seg");
    expect(count(out, "data-animation=\"chart-grow\"")).toBe(1);
});

test("a line chart draws its plot with the draw animation", () => {
    const out = render(ChartKind.Line, ["Jan", "Feb"], [ { name: "A", values: [1, 2] } ]);
    expect(out).toContain("chart-svg");
    expect(out).toContain("data-animation=\"chart-draw\"");
    expect(out).toContain("chart-stroke");
});

test("an area chart fills beneath the line", () => {
    const out = render(ChartKind.Area, ["Jan", "Feb"], [ { name: "A", values: [1, 2] } ]);
    expect(out).toContain("data-animation=\"chart-draw\"");
    expect(out).toContain("chart-fill");
});

test("a pie chart wipes its svg and draws one slice per category", () => {
    const out = render(ChartKind.Pie, ["A", "B", "C"], [ { name: "Share", values: [60, 30, 10] } ]);
    expect(out).toContain("chart-pie-panel");
    expect(out).toContain("data-animation=\"chart-wipe\"");
    expect(count(out, "chart-slice")).toBe(3);
});
