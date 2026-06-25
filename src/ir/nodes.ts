import type { DeckConfig } from "#/config";

export enum BlockKind {
    Prose = "prose",
    Html = "html",
    Cards = "cards",
    Metrics = "metrics",
    Bars = "bars",
    Code = "code",
    Columns = "columns"
}

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

export type Block =
    | { kind: BlockKind.Prose, markdown: string }
    | { kind: BlockKind.Html, markup: string }
    | { kind: BlockKind.Cards, cards: Array<Card> }
    | { kind: BlockKind.Metrics, rows: Array<MetricRow> }
    | { kind: BlockKind.Bars, rows: Array<BarRow> }
    | { kind: BlockKind.Code, lang: string, content: string }
    | { kind: BlockKind.Columns, left: Array<Block>, right: Array<Block> };

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
