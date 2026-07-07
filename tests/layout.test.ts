import { test, expect } from "vitest";
import { barFraction, gridCols, metricCols } from "#/layout";

test("gridCols lays four cards as a 2x2 grid and caps the rest at three columns", () => {
    expect(gridCols(1)).toBe(1);
    expect(gridCols(3)).toBe(3);
    expect(gridCols(4)).toBe(2);
    expect(gridCols(5)).toBe(3);
    expect(gridCols(0)).toBe(1);
});

test("metricCols caps at four columns", () => {
    expect(metricCols(1)).toBe(1);
    expect(metricCols(4)).toBe(4);
    expect(metricCols(6)).toBe(4);
    expect(metricCols(0)).toBe(1);
});

test("barFraction clamps a percent into 0..1", () => {
    expect(barFraction(60)).toBe(0.6);
    expect(barFraction(0)).toBe(0);
    expect(barFraction(100)).toBe(1);
    expect(barFraction(150)).toBe(1);
    expect(barFraction(-10)).toBe(0);
});
