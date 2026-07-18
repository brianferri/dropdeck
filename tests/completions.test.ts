// The snippet strings deliberately contain `${n:placeholder}` tabstop markers, parsed by parseSnippet -- not
// template interpolations.
/* eslint-disable no-template-curly-in-string */
import { test, expect } from "vitest";
import { completionsAt, parseSnippet } from "#/host/cmp";
import { COLORS, describe } from "#/host/language";
import { completionItemView } from "#/host/components/editor.component";
import { serializeAll } from "#/dom";

// The caret is marked with `|`; returns the completion at that offset with the marker stripped.
function at(marked: string): ReturnType<typeof completionsAt> {
    const caret = marked.indexOf("|");
    return completionsAt(marked.replace("|", ""), caret);
}

function labels(marked: string): Array<string> {
    return (at(marked)?.items ?? []).map((item) => item.label);
}

test("parseSnippet expands placeholders into plain text and records the stops", () => {
    expect(parseSnippet("plain text").text).toBe("plain text");
    expect(parseSnippet("plain text").stops).toEqual([]);

    const two = parseSnippet("${1:Series} | ${2:x}");
    expect(two.text).toBe("Series | x");
    expect(two.stops.length).toBe(2);

    const cursor = parseSnippet("chart\n$0");
    expect(cursor.text).toBe("chart\n");
    expect(cursor.stops.length).toBe(1);
});

test("parseSnippet places a stop over the span its placeholder occupies", () => {
    const snippet = parseSnippet("${1:foo}bar");
    expect(snippet.text).toBe("foobar");
    expect(snippet.stops[0]).toEqual({ start: 0, end: 3 });
});

test("describe finds the doc for a fence tag, stripping the backticks", () => {
    expect(describe("```chart")?.label).toBe("chart");
    expect(describe("```chart")?.detail).toBe("grouped bar chart");
    expect(describe("```chart line")?.label).toBe("chart line");
    expect(describe("```metrics")?.label).toBe("metrics");
});

test("describe finds the doc for a directive, and returns null for anything unknown", () => {
    expect(describe("::right::")?.label).toBe("::right::");
    expect(describe("nonsense")).toBe(null);
});

test("the fence completions offer the math and latex formula languages", () => {
    expect(labels("# T\n\n```mat|")).toContain("math");
    expect(labels("# T\n\n```lat|")).toContain("latex");
});

test("inside a math fence, a word offers math functions and constants", () => {
    expect(labels("# T\n\n```math\nsq|\n```\n")).toEqual(["sqrt"]);
    expect(labels("# T\n\n```math\np|\n```\n")).toContain("pi");
});

test("inside a latex fence, a backslash offers commands; a bare word offers nothing", () => {
    expect(labels("# T\n\n```latex\n\\fra|\n```\n")).toEqual(["\\frac"]);
    expect(labels("# T\n\n```latex\n\\c|\n```\n")).toEqual(expect.arrayContaining(["\\cdot", "\\cup", "\\cap", "\\cos", "\\coprod"]));
    expect(at("# T\n\n```latex\nfra|\n```\n")).toBe(null);
});

test("outside any formula fence, math/latex tokens are not offered", () => {
    expect(at("# T\n\nsq|\n")).toBe(null);
});

test("a math color directive offers the supported palette, each with its hex swatch", () => {
    expect(labels("# T\n\n```math\ncolor(|\n```\n")).toEqual(expect.arrayContaining(["red", "blue", "green", "grey"]));
    expect(labels("# T\n\n```math\ncolor(re|\n```\n")).toEqual(["red"]);
    const first = at("# T\n\n```math\ncolor(red|\n```\n")?.items[0];
    expect(first?.color).toBe("#FF0000");
    expect(first?.detail).toBe("#FF0000");
});

test("a latex color directive offers the same palette inside its braces", () => {
    expect(labels("# T\n\n```latex\n\\textcolor{|\n```\n")).toEqual(expect.arrayContaining(["red", "blue"]));
    expect(labels("# T\n\n```latex\n\\textcolor{gr|\n```\n")).toEqual(expect.arrayContaining(["green", "gray", "grey"]));
});

test("once the color name is committed, the palette gives way to the ordinary tokens", () => {
    expect(at("# T\n\n```math\ncolor(red, |\n```\n")).toBe(null);
    expect(labels("# T\n\n```math\ncolor(red, sq|\n```\n")).toEqual(["sqrt"]);
});

test("a color completion renders a swatch painted with its hex", () => {
    const red = COLORS.find((item) => item.label === "red");
    if (red === undefined) throw new Error("expected a red color completion");
    const html = serializeAll([completionItemView(red, 0, false)]);
    expect(html).toContain("completion-swatch");
    expect(html).toMatch(/background-color:\s*#FF0000/);
});
