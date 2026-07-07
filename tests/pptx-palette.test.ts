import { test, expect } from "vitest";
import { emu, fontSize, SLIDE_WIDTH_EMU } from "#/export/pptx/units";
import { resolvePalette } from "#/export/pptx/palette";

test("emu converts px to English Metric Units at 9525 per px", () => {
    expect(emu(0)).toBe(0);
    expect(emu(1)).toBe(9525);
    expect(emu(10)).toBe(95250);
    expect(emu(1280)).toBe(SLIDE_WIDTH_EMU);
});

test("fontSize converts px to OOXML centipoints", () => {
    expect(fontSize(20)).toBe(1700);
    expect(fontSize(0)).toBe(0);
});

test("resolvePalette resolves a dark deck to the dark accent defaults", () => {
    const palette = resolvePalette({ dark: "true" });
    expect(palette.dark).toBe(true);
    expect(palette.accents).toEqual(["5CD0B3", "58C4DD", "F59E0B"]);
    expect(palette.accent1).toBe("5CD0B3");
});

test("resolvePalette defaults to light and honours an accent override", () => {
    expect(resolvePalette({}).dark).toBe(false);
    expect(resolvePalette({}).accent1).toBe("0F766E");
    expect(resolvePalette({ accent: "#abcdef" }).accent1).toBe("ABCDEF");
});

test("resolvePalette treats theme:dark and colorSchema:dark as dark", () => {
    expect(resolvePalette({ theme: "dark" }).dark).toBe(true);
    expect(resolvePalette({ colorSchema: "dark" }).dark).toBe(true);
});
