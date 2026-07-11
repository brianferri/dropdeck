import { expect, test } from "vitest";
import { parse } from "#/front/parser";
import { BlockKind, ChartKind } from "#/ir";
import type { Block, Deck } from "#/ir";

function firstBlock<K extends BlockKind>(deck: Deck, kind: K): Extract<Block, { kind: K }> {
    const block = deck.slides[0]?.blocks.find((candidate) => candidate.kind === kind);
    if (block === undefined) throw new Error(`no ${kind} block on the first slide`);
    return block as Extract<Block, { kind: K }>;
}

test("front-matter: keys parse and surrounding quotes strip", () => {
    const deck = parse("---\naccent: \"#7befeb\"\nfont: 'Manrope'\ndark: true\n---\n\n# Title\n");
    expect(deck.config.accent).toBe("#7befeb");
    expect(deck.config.font).toBe("Manrope");
    expect(deck.config.dark).toBe("true");
});

test("slides split on a --- fence and titles extract off the body", () => {
    const deck = parse("# One\n\nbody one\n\n---\n\n# Two\n\nbody two\n");
    expect(deck.slides.length).toBe(2);
    expect(deck.slides[0].title).toBe("One");
    expect(deck.slides[1].title).toBe("Two");
});

test("a leading emoji-only line becomes an emoji, not prose", () => {
    const deck = parse("\u{1F680}\n\n# Launch\n\nbody\n");
    expect(deck.slides[0].emojis).toEqual(["\u{1F680}"]);
    expect(deck.slides[0].title).toBe("Launch");
});

test("metrics fence -> Metrics rows split value | label | sub", () => {
    const deck = parse("# M\n\n```metrics\n42 | Answer | to everything\n7 | Count |\n```\n");
    const block = firstBlock(deck, BlockKind.Metrics);
    expect(block.rows[0]).toEqual({ value: "42", label: "Answer", sub: "to everything" });
    expect(block.rows[1]).toEqual({ value: "7", label: "Count", sub: "" });
});

test("bars fence -> Bars rows with a parsed percent, defaulting to 0", () => {
    const deck = parse("# B\n\n```bars\nAlpha | 95% | 95\nBeta | n/a |\n```\n");
    const block = firstBlock(deck, BlockKind.Bars);
    expect(block.rows[0]?.percent).toBe(95);
    expect(block.rows[1]?.percent).toBe(0);
});

test("chart fence -> a Chart with series named by the header and category rows of numbers", () => {
    const deck = parse("# G\n\n```chart\n | Signups | Active\nJan | 120 | 90\nFeb | 180 | n/a\n```\n");
    const block = firstBlock(deck, BlockKind.Chart);
    expect(block.chart.kind).toBe(ChartKind.Bars);
    expect(block.chart.categories).toEqual(["Jan", "Feb"]);
    expect(block.chart.series.map((series) => series.name)).toEqual(["Signups", "Active"]);
    expect(block.chart.series[0]?.values).toEqual([120, 180]);
    // A non-numeric cell defaults to 0 rather than NaN, matching the bars fence.
    expect(block.chart.series[1]?.values).toEqual([90, 0]);
});

test("chart fence type -> the kind from the fence tag; an unknown type is not a chart", () => {
    const line = firstBlock(parse("# L\n\n```chart line\n | A\nJan | 1\n```\n"), BlockKind.Chart);
    expect(line.chart.kind).toBe(ChartKind.Line);
    const pie = firstBlock(parse("# P\n\n```chart pie\n | A\nJan | 1\n```\n"), BlockKind.Chart);
    expect(pie.chart.kind).toBe(ChartKind.Pie);
    // An unrecognised type is not a chart fence, so it stays a code block keeping its info string.
    const unknown = firstBlock(parse("# U\n\n```chart bogus\ncontent\n```\n"), BlockKind.Code);
    expect(unknown.lang).toBe("chart bogus");
});

test("### runs -> a Cards block with title and trimmed body", () => {
    const deck = parse("# C\n\n### Alpha\nbody a\n\n### Beta\nbody b\n");
    const block = firstBlock(deck, BlockKind.Cards);
    expect(block.cards.length).toBe(2);
    expect(block.cards[0]).toEqual({ title: "Alpha", body: "body a" });
    expect(block.cards[1]?.title).toBe("Beta");
});

test("a non-metrics/bars fence stays a Code block keeping its lang", () => {
    const deck = parse("# Code\n\n```ts\nconst x = 1;\n```\n");
    const block = firstBlock(deck, BlockKind.Code);
    expect(block.lang).toBe("ts");
    expect(block.content).toBe("const x = 1;");
});

test("::right:: splits into one Columns block, one column per segment", () => {
    const deck = parse("# Cols\n\nleft prose\n::right::\nmid prose\n::right::\nright prose\n");
    const block = firstBlock(deck, BlockKind.Columns);
    expect(block.columns.length).toBe(3);
    expect(block.columns.every((column) => column[0]?.kind === BlockKind.Prose)).toBe(true);
});

test("a block-level HTML body is kept whole as one Html block", () => {
    const deck = parse("# H\n\n<div class=\"grid grid-cols-2\"><div>a</div><div>b</div></div>\n");
    expect(deck.slides[0].blocks[0].kind).toBe(BlockKind.Html);
});

test("empty source and a front-matter-only document yield no slides", () => {
    expect(parse("").slides.length).toBe(0);
    expect(parse("---\naccent: \"#abc\"\n---\n").slides.length).toBe(0);
});

test("a metric line with no separators keeps the whole text as the value", () => {
    const deck = parse("# M\n\n```metrics\nlonely\n```\n");
    const block = firstBlock(deck, BlockKind.Metrics);
    expect(block.rows[0]).toEqual({ value: "lonely", label: "", sub: "" });
});

test("a per-slide front-matter block sets that slide's frontmatter", () => {
    const deck = parse("# One\n\n---\nlayout: center\n---\n\n# Two\n");
    expect(deck.slides.length).toBe(2);
    expect(deck.slides[1].frontmatter.layout).toBe("center");
    expect(deck.slides[1].title).toBe("Two");
});

test("CRLF line endings normalise so front-matter and slides still parse", () => {
    const deck = parse("---\r\naccent: \"#abc\"\r\n---\r\n\r\n# One\r\n\r\n---\r\n\r\n# Two\r\n");
    expect(deck.config.accent).toBe("#abc");
    expect(deck.slides.map((slide) => slide.title)).toEqual(["One", "Two"]);
});

test("a `###` line is a card, not a slide title", () => {
    const deck = parse("# Real\n\n### Card\nbody\n");
    expect(deck.slides[0].title).toBe("Real");
    expect(deck.slides[0].blocks.map((block) => block.kind)).toContain(BlockKind.Cards);
});
