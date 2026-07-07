// The snippet strings deliberately contain `${n:placeholder}` tabstop markers, parsed by parseSnippet -- not
// template interpolations.
/* eslint-disable no-template-curly-in-string */
import { test, expect } from "vitest";
import { parseSnippet } from "#/host/cmp";
import { describe } from "#/host/language";

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
