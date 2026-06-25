import { describe as suite, expect, test } from "vitest";
import { completionsAt, parseSnippet } from "#/host/cmp";

// The snippet inputs below contain literal `${n:placeholder}` markers parsed by parseSnippet, not interpolated.
/* eslint-disable no-template-curly-in-string */

function labels(source: string, caret: number): Array<string> {
    const c = completionsAt(source, caret);
    return c === null ? [] : c.items.map((i) => i.label);
}

suite("completionsAt context", () => {
    test("fence opener offers component fences", () => {
        const src = "# Slide\n\n```";
        expect(labels(src, src.length)).toEqual(["metrics", "bars"]);
        const partial = "# Slide\n\n```ba";
        expect(labels(partial, partial.length)).toEqual(["bars"]);
    });

    test("directive line offers the column split", () => {
        const src = "body\n::";
        expect(labels(src, src.length)).toEqual(["::right::"]);
    });

    test("inside deck frontmatter offers config keys", () => {
        const src = "---\nacc";
        expect(labels(src, src.length)).toContain("accent");
        // After a `:` the key is chosen; no more key completions on that line.
        const valued = "---\naccent: ";
        expect(labels(valued, valued.length)).toEqual([]);
    });

    test("an enumerable key offers its values after the colon, filtering by what is typed", () => {
        const all = "---\nlayout: ";
        expect(labels(all, all.length)).toEqual(["center", "default"]);
        const typed = "---\nlayout: ce";
        const c = completionsAt(typed, typed.length);
        expect(c?.items.map((i) => i.label)).toEqual(["center"]);
        expect(c?.from).toBe(typed.length - 2);
        expect(c?.to).toBe(typed.length);
    });

    test("a free-form colour key offers no value list", () => {
        const src = "---\naccent: #ab";
        expect(completionsAt(src, src.length)).toBeNull();
    });

    test("a per-slide frontmatter block offers config keys like the deck head", () => {
        const src = "---\ntheme: dark\n---\n\n# One\n\n---\nacc";
        expect(labels(src, src.length)).toContain("accent");
    });

    test("a slide body line does not offer frontmatter keys", () => {
        const src = "---\ntheme: dark\n---\n\n# One\n\nacc";
        expect(labels(src, src.length)).not.toContain("accent");
    });

    test("bare word at line start offers snippets, replacing the word", () => {
        const src = "# Slide\n\nsli";
        const c = completionsAt(src, src.length);
        expect(c?.items.map((i) => i.label)).toEqual(["slide"]);
        expect(c?.from).toBe(src.length - 3);
        expect(c?.to).toBe(src.length);
    });

    test("mid-prose word does not trigger", () => {
        const src = "this is a sentence";
        expect(completionsAt(src, src.length)).toBeNull();
    });

    test("--- at line start offers the frontmatter snippet", () => {
        const src = "# Slide\n\n---";
        expect(labels(src, src.length)).toContain("---");
    });

    test("inside a `](` destination offers dropped assets, replacing the typed path", () => {
        const assets = ["logo.png", "imagedeck/cover.png", "diagram.svg"];
        const src = "See ![alt](lo";
        const c = completionsAt(src, src.length, assets);
        expect(c?.items.map((i) => i.label)).toEqual(["logo.png"]);
        expect(c?.from).toBe(src.indexOf("](") + 2);
        expect(c?.to).toBe(src.length);
    });

    test("a closed destination does not offer assets", () => {
        const assets = ["logo.png"];
        const src = "![a](logo.png) and more";
        expect(completionsAt(src, src.length, assets)).toBeNull();
    });

    test("no assets loaded means no destination completions", () => {
        const src = "![alt](lo";
        expect(completionsAt(src, src.length, [])).toBeNull();
    });
});

suite("parseSnippet tab-stops", () => {
    test("strips markers and orders stops, $0 last", () => {
        const snip = parseSnippet("```metrics\n${1:42} | ${2:label} | ${3:detail}\n```\n$0");
        expect(snip.text).toBe("```metrics\n42 | label | detail\n```\n");
        // Stop 1 covers "42" at offset 11.
        expect(snip.text.slice(snip.stops[0].start, snip.stops[0].end)).toBe("42");
        expect(snip.text.slice(snip.stops[1].start, snip.stops[1].end)).toBe("label");
        expect(snip.text.slice(snip.stops[2].start, snip.stops[2].end)).toBe("detail");
        // The final $0 is a zero-width exit stop at the very end.
        const exit = snip.stops[snip.stops.length - 1];
        expect(exit.start).toBe(snip.text.length);
        expect(exit.end).toBe(snip.text.length);
    });

    test("columns snippet places the stops on each side of the split", () => {
        const snip = parseSnippet("${1:left}\n\n::right::\n\n${0:right}\n");
        expect(snip.text).toBe("left\n\n::right::\n\nright\n");
        expect(snip.stops.length).toBe(2);
        expect(snip.text.slice(snip.stops[0].start, snip.stops[0].end)).toBe("left");
        expect(snip.text.slice(snip.stops[1].start, snip.stops[1].end)).toBe("right");
    });
});
