import { test, expect } from "vitest";
import { lowerBlocks } from "#/export/pptx/blocks";
import { idFactory, relFactory } from "#/export/pptx/build";
import { resolvePalette } from "#/export/pptx/palette";
import { xml } from "@dropdeck/pptx";
import { BlockKind, FormulaNotation } from "#/ir";
import type { Embed } from "#/export/pptx/lower";
import type { Block } from "#/ir";

function embed(): Embed {
    return { nextId: idFactory(), nextRelId: relFactory(), palette: resolvePalette({}), assets: new Map<string, string>(), svgPngs: new Map<string, string>() };
}

function lower(block: Block): { shapes: number, markup: string } {
    const { shapes } = lowerBlocks([block], embed(), 0, 0, 800);
    return { shapes: shapes.length, markup: shapes.map((shape) => xml(shape)).join("") };
}

test("a math formula lowers to a native OMML equation in a bare text box", () => {
    const { shapes, markup } = lower({ kind: BlockKind.Formula, notation: FormulaNotation.Math, source: "x^2" });
    expect(shapes).toBe(1);
    expect(markup).toContain("<mc:AlternateContent");
    expect(markup).toContain("Requires=\"a14\"");
    expect(markup).toContain("<a14:m><m:oMathPara");
    expect(markup).toContain("<m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup>");
    expect(markup).toContain("<mc:Fallback>");
    expect(markup).toContain("x^2");
    expect(markup).toContain("<a:defRPr");
});

function mathZone(markup: string): string {
    return markup.slice(markup.indexOf("<a14:m>"), markup.indexOf("</a14:m>"));
}

test("a math formula and its latex twin lower to the same OMML equation", () => {
    const math = lower({ kind: BlockKind.Formula, notation: FormulaNotation.Math, source: "(a+b)*c" });
    const latex = lower({ kind: BlockKind.Formula, notation: FormulaNotation.Latex, source: "(a+b) \\cdot c" });
    expect(mathZone(math.markup)).toBe(mathZone(latex.markup));
    expect(mathZone(math.markup)).toContain("<m:r><m:t>·</m:t></m:r>");
});

test("a malformed formula shows the source and the parser error in red, not the equation", () => {
    const { markup } = lower({ kind: BlockKind.Formula, notation: FormulaNotation.Math, source: "x +" });
    expect(markup).not.toContain("<m:oMath");
    expect(markup).toContain("x +");
    expect(markup).toContain("e5484d");
});
