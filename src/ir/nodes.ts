import { memberGuard } from "@dropdeck/common";
import type { DeckConfig } from "#/config";

export enum BlockKind {
    Prose = "prose",
    Html = "html",
    Cards = "cards",
    Metrics = "metrics",
    Bars = "bars",
    Chart = "chart",
    Code = "code",
    Formula = "formula",
    Columns = "columns"
}

export enum FormulaNotation {
    Math = "math",
    Latex = "latex"
}
export const isFormulaNotation = memberGuard<FormulaNotation>(Object.values(FormulaNotation));

export enum SlideLayout {
    Cover = "cover",
    Section = "section",
    Content = "content"
}

export type Card = {
    title: string,
    body: string
};

export type MetricRow = {
    value: string,
    label: string,
    sub: string
};

export type BarRow = {
    label: string,
    tag: string,
    percent: number
};

export enum ChartKind {
    Bars = "bars",
    Stacked = "stacked",
    Line = "line",
    Area = "area",
    Pie = "pie"
}

export type ChartSeries = {
    name: string,
    values: Array<number>
};

// A chart over `categories` with one or more `series`. `kind` picks the geometry; Pie reads only the first series,
// the cartesian kinds read all of them.
export type ChartData = {
    kind: ChartKind,
    categories: Array<string>,
    series: Array<ChartSeries>
};

export type Block =
    | { kind: BlockKind.Prose, markdown: string }
    | { kind: BlockKind.Html, markup: string }
    | { kind: BlockKind.Cards, cards: Array<Card> }
    | { kind: BlockKind.Metrics, rows: Array<MetricRow> }
    | { kind: BlockKind.Bars, rows: Array<BarRow> }
    | { kind: BlockKind.Chart, chart: ChartData }
    | { kind: BlockKind.Code, lang: string, content: string }
    | { kind: BlockKind.Formula, notation: FormulaNotation, source: string }
    | { kind: BlockKind.Columns, columns: Array<Array<Block>> };

export type Slide = {
    frontmatter: DeckConfig,
    title: string | null,
    emojis: Array<string>,
    blocks: Array<Block>
};

export type Deck = {
    config: DeckConfig,
    slides: Array<Slide>
};

// Kept beside `Deck` rather than as a field of it, since references resolve from the dropped files, not the source.
export type AssetMap = ReadonlyMap<string, string>;
