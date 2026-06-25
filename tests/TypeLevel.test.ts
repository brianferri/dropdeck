import { expect, test } from "vitest";
import { parse } from "#/front/parser";
import { BlockKind } from "#/ir";
import type { Deck } from "#/ir";
import type { ParseDeck } from "#/front/Parse";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Slides = ParseDeck<"# One\n\nbody one\n\n---\n\n# Two\n\nbody two\n">["slides"];
type Metrics = ParseDeck<"# M\n\n```metrics\n42 | Answer | x\n```\n">["slides"][0]["blocks"][0];
type Bars = ParseDeck<"# B\n\n```bars\nAlpha | 95% | 95\n```\n">["slides"][0]["blocks"][0];
type Cards = ParseDeck<"# C\n\n### Alpha\nbody a\n\n### Beta\nbody b\n">["slides"][0]["blocks"][0];
type Columns = ParseDeck<"# K\n\n::left::\na\n::right::\nb\n">["slides"][0]["blocks"][0];
type Html = ParseDeck<"# H\n\n<div class=\"x\">a</div>\n">["slides"][0]["blocks"][0];
type Code = ParseDeck<"# Code\n\n```ts\nconst x = 1;\n```\n">["slides"][0]["blocks"][0];
type Config = ParseDeck<"---\naccent: \"#7befeb\"\nfont: 'Manrope'\ndark: true\n---\n\n# T\n">["config"];

export type Assertions = [
    Expect<Equal<ParseDeck<string>, Deck>>,
    Expect<Equal<ParseDeck<"">["slides"], []>>,
    Expect<Equal<Slides["length"], 2>>,
    Expect<Equal<Slides[0]["title"], "One">>,
    Expect<Equal<Slides[1]["title"], "Two">>,
    Expect<Equal<Slides[0]["blocks"][0], { kind: BlockKind.Prose, markdown: "body one" }>>,
    // A percent literal stays `number`, not a string literal, because runtime parseFloat produces it.
    Expect<Equal<Metrics, { kind: BlockKind.Metrics, rows: [{ value: "42", label: "Answer", sub: "x" }] }>>,
    Expect<Equal<Bars["rows"][0], { label: "Alpha", tag: "95%", percent: number }>>,
    Expect<Equal<Cards["cards"], [{ title: "Alpha", body: "body a" }, { title: "Beta", body: "body b" }]>>,
    Expect<Equal<Columns["left"][0], { kind: BlockKind.Prose, markdown: "a" }>>,
    Expect<Equal<Columns["right"][0], { kind: BlockKind.Prose, markdown: "b" }>>,
    Expect<Equal<Html["kind"], BlockKind.Html>>,
    Expect<Equal<Code, { kind: BlockKind.Code, lang: "ts", content: "const x = 1;" }>>,
    Expect<Equal<Config, { accent: "#7befeb", font: "Manrope", dark: "true" }>>,
    Expect<Equal<Config["accent"], "#7befeb">>,
    Expect<Equal<Config["font"], "Manrope">>,
    Expect<Equal<Config["dark"], "true">>
];

test("type-level: a literal deck's inferred IR matches its runtime value", () => {
    const deck = parse("# Code\n\n```ts\nconst x = 1;\n```\n");
    expect(deck.slides[0].blocks[0]).toEqual({ kind: BlockKind.Code, lang: "ts", content: "const x = 1;" });
});
