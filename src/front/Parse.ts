// Where the type system cannot compute a value, this widens to the general IR type rather than guess, keeping the
// runtime cast in `parse` sound: a guess that disagreed with the runtime would make that cast a lie.

import type { BlockKind } from "#/ir";
import type { Block, Card, Deck, Slide } from "#/ir";
import type { DeckConfig } from "#/config";
import type { Cell, Contains, FromEntries, Normalize, SplitOn, Trim, TrimEnd, TrimStart } from "#/front/strings";

// Aliased because a backtick cannot appear inside a template-literal type.
type Fence = "```";

type StripFrontMatter<S extends string> = S extends `---\n${string}\n---\n${infer Body}` ? Body : S;

// `### ` is a card, so a third hash must not match the heading title.
type HeadingTitle<Line extends string> =
    Line extends `## ${infer Title}` ? Trim<Title>
        : Line extends `# ${infer Title}` ? Trim<Title>
            : null;

// A per-slide front-matter chunk (`ident:`) is the signal to widen the whole deck, since the runtime pairs the
// chunk with the next slide rather than treating it as a slide of its own.
type IdentChar =
    | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p"
    | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
    | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P"
    | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
    | "_";
type LooksKeyValue<Line extends string> =
    Line extends `${infer First}${string}:${string}`
        ? First extends IdentChar ? (Contains<Line, " "> extends true ? Contains<Line, ": "> : true) : false
        : false;

type FirstLine<S extends string> = TrimStart<S> extends `${infer Line}\n${string}` ? Line : TrimStart<S>;

// Over-widening (a prose line that merely looks like `key:`) is still sound; under-widening would not be.
type AnyLooksFrontmatter<Parts extends Array<string>> =
    Parts extends [infer Head extends string, ...infer Tail extends Array<string>]
        ? Trim<Head> extends "" ? AnyLooksFrontmatter<Tail>
            : LooksKeyValue<FirstLine<Head>> extends true ? true : AnyLooksFrontmatter<Tail>
        : false;

type HtmlTagStart = "<div" | "<section" | "<video" | "<table" | "<figure" | "<aside" | "<header" | "<footer"
    | "<main" | "<article" | "<iframe";
type IsHtmlBlock<Text extends string> = Contains<Lowercase<Text>, HtmlTagStart> extends true ? true : false;

type NonEmptyLines<Lines extends Array<string>, Acc extends Array<string> = []> =
    Lines extends [infer Line extends string, ...infer Rest extends Array<string>]
        ? Trim<Line> extends "" ? NonEmptyLines<Rest, Acc> : NonEmptyLines<Rest, [...Acc, Line]>
        : Acc;
type RowCells<Body extends string> =
    NonEmptyLines<SplitOn<Body, "\n">> extends infer Lines extends Array<string>
        ? { [Index in keyof Lines]: SplitOn<Trim<Lines[Index]>, "|"> }
        : [];

// `kind`'s enum value is the fence info string, so the spec doubles as the match key against a fence's `lang`. A
// `number`-typed field is one the runtime computes (a bar percent via `parseFloat`) and cannot be read as a cell.
type FenceSpec =
    | { kind: BlockKind.Metrics, fields: { value: 0, label: 1, sub: 2 } }
    | { kind: BlockKind.Bars, fields: { label: 0, tag: 1, percent: number } };

type Row<Fields, Cells extends Array<string>> = {
    [Field in keyof Fields]: number extends Fields[Field]
        ? number
        : Trim<Cell<Cells, Fields[Field] & number>>
};

type RowFence<Spec extends FenceSpec, Body extends string> =
    RowCells<Body> extends infer Cells extends Array<Array<string>> ? {
        kind: Spec["kind"],
        rows: { [Index in keyof Cells]: Row<Spec["fields"], Cells[Index]> }
    } : never;

type FenceBlock<Lang extends string, Body extends string> =
    [Extract<FenceSpec, { kind: Lang }>] extends [never]
        ? { kind: BlockKind.Code, lang: Lang, content: TrimEnd<Body> }
        : RowFence<Extract<FenceSpec, { kind: Lang }>, Body>;

type ParseFence<Lang extends string, Body extends string, After extends string> =
    Trim<After> extends "" ? [FenceBlock<Trim<Lang>, Body>] : Array<Block>;

type SplitColumns<S extends string, Acc extends ReadonlyArray<string> = []> =
    S extends `${infer Head}\n::right::\n${infer Rest}` ? SplitColumns<Rest, [...Acc, Head]> : [...Acc, S];

type ColumnsOf<Text extends string> =
    SplitColumns<Text extends `::left::\n${infer Rest}` ? Rest : Text> extends infer Cols extends ReadonlyArray<string>
        ? { kind: BlockKind.Columns, columns: { [Index in keyof Cols]: ParseBlocks<Trim<Cols[Index] & string>> } }
        : { kind: BlockKind.Columns, columns: Array<Array<Block>> };

type StartsBlock<Line extends string> = Line extends `### ${string}` ? true : Line extends `${Fence}${string}` ? true : false;

type CardBody<S extends string, Acc extends string = ""> =
    S extends `${infer Line}\n${infer Rest}`
        ? StartsBlock<Line> extends true ? [Trim<Acc>, S] : CardBody<Rest, `${Acc}${Line}\n`>
        : StartsBlock<S> extends true ? [Trim<Acc>, S] : [Trim<`${Acc}${S}`>, ""];

type ParseCards<Text extends string, Acc extends Array<Card> = []> =
    TrimStart<Text> extends `### ${infer Rest}`
        ? Rest extends `${infer Title}\n${infer After}`
            ? CardBody<After> extends [infer Body extends string, infer Remain extends string]
                ? ParseCards<Remain, [...Acc, { title: Trim<Title>, body: Body }]>
                : Acc
            : [...Acc, { title: Trim<Rest>, body: "" }]
        : Acc;

type ParseBlocks<Text extends string> = BlocksOf<Trim<Text>>;

type BlocksOf<Text extends string> =
    Text extends "" ? []
        : Contains<Text, "\n::right::"> extends true ? [ColumnsOf<Text>]
            : IsHtmlBlock<Text> extends true ? [{ kind: BlockKind.Html, markup: Text }]
                : LineBlock<Text>;

// Guards prose only: a cards run ends only at a fence, since a later `### ` is another card, not a second block.
type Multi<Text extends string> = Contains<Text, Fence> extends true ? true : Contains<Text, "\n### ">;

type LineBlock<Text extends string> =
    Text extends `${Fence}${infer Lang}\n${infer Body}`
        ? Body extends `${infer Content}${Fence}${infer After}` ? ParseFence<Lang, Content, After> : Array<Block>
        : Text extends `### ${string}`
            ? Contains<Text, Fence> extends true ? Array<Block> : [{ kind: BlockKind.Cards, cards: ParseCards<Text> }]
            : Multi<Text> extends true ? Array<Block> : [{ kind: BlockKind.Prose, markdown: Text }];

// A title-less first line widens to `Slide` because emoji extraction needs a Unicode-property test the type
// system cannot run, so `emojis` cannot be computed precisely.
type SlideOf<Title extends string | null, Blocks extends Array<Block>> =
    Title extends null ? Slide : { frontmatter: DeckConfig, title: Title, emojis: Array<string>, blocks: Blocks };

type ParseSlide<Raw extends string> =
    TrimStart<Raw> extends `${infer Line}\n${infer Rest}`
        ? SlideOf<HeadingTitle<Line>, ParseBlocks<Trim<Rest>>>
        : SlideOf<HeadingTitle<TrimStart<Raw>>, []>;

type ParseSlides<Parts extends Array<string>, Acc extends Array<Slide> = []> =
    Parts extends [infer Head extends string, ...infer Tail extends Array<string>]
        ? Trim<Head> extends "" ? ParseSlides<Tail, Acc>
            : ParseSlide<Head> extends infer One extends Slide ? ParseSlides<Tail, [...Acc, One]> : ParseSlides<Tail, Acc>
        : Acc;

type Unquote<V extends string> =
    (V extends `"${infer R}` ? R : V extends `'${infer R}` ? R : V) extends infer A extends string
        ? A extends `${infer B}"` ? B : A extends `${infer B}'` ? B : A
        : V;

type IsConfigKey<Key extends string> =
    Key extends "" ? false : Contains<Key, " "> extends true ? false : Key extends `${IdentChar}${string}` ? true : false;

// Built as `[key, value]` entries so `FromEntries` produces one flat object, with no per-key intersection to
// flatten away.
type ConfigEntries<Lines extends Array<string>, Acc extends Array<[string, string]> = []> =
    Lines extends [infer Line extends string, ...infer Rest extends Array<string>]
        ? Line extends `${infer Key}:${infer Value}`
            ? IsConfigKey<Trim<Key>> extends true
                ? ConfigEntries<Rest, [...Acc, [Trim<Key>, Unquote<Trim<Value>>]]>
                : ConfigEntries<Rest, Acc>
            : ConfigEntries<Rest, Acc>
        : Acc;

type DeckConfigOf<Src extends string> =
    Src extends `---\n${infer FrontMatter}\n---\n${string}` ? FromEntries<ConfigEntries<SplitOn<FrontMatter, "\n">>> : DeckConfig;

type ParseDeckLiteral<S extends string> =
    Normalize<S> extends infer Src extends string
        ? SplitOn<StripFrontMatter<Src>, "\n---\n"> extends infer Parts extends Array<string>
            ? AnyLooksFrontmatter<Parts> extends true ? Deck
                : { config: DeckConfigOf<Src>, slides: ParseSlides<Parts> }
            : Deck
        : Deck;

export type ParseDeck<S extends string> = string extends S ? Deck : ParseDeckLiteral<S>;
