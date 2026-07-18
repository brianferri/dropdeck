import { RawBlockKind, tokenize } from "#/front/lexer";
import { BlockKind, ChartKind, isFormulaNotation } from "#/ir";
import { isWhitespace, memberGuard } from "@dropdeck/common";
import type { BarRow, Block, ChartData, ChartSeries, MetricRow, Slide } from "#/ir";
import type { DeckConfig } from "#/config";
import type { ParseDeck } from "#/front/Parse";

const HTML_BLOCK_TAGS = ["div", "section", "video", "table", "figure", "aside", "header", "footer", "main", "article", "iframe"];

function isKeyStart(ch: string): boolean {
    if (ch >= "a" && ch <= "z") return true;
    if (ch >= "A" && ch <= "Z") return true;
    return ch === "_";
}

function isKeyChar(ch: string): boolean {
    if (isKeyStart(ch)) return true;
    if (ch >= "0" && ch <= "9") return true;
    return ch === "-";
}

function hasHtmlBlock(text: string): boolean {
    const lower = text.toLowerCase();
    for (const tag of HTML_BLOCK_TAGS) {
        const opener = `<${tag}`;
        let at = lower.indexOf(opener);
        while (at >= 0) {
            const after = lower.charAt(at + opener.length);
            if (isWhitespace(after) || after === "/" || after === ">") return true;
            at = lower.indexOf(opener, at + 1);
        }
    }
    return false;
}

function stripQuotes(value: string): string {
    let inner = value;
    if (inner.startsWith("'") || inner.startsWith("\"")) inner = inner.slice(1);
    const last = inner.length - 1;
    if (last >= 0 && (inner[last] === "'" || inner[last] === "\"")) inner = inner.slice(0, last);
    return inner;
}

function isKeyColon(line: string): number {
    if (!isKeyStart(line.charAt(0))) return -1;
    let at = 1;
    while (at < line.length && isKeyChar(line[at])) at += 1;
    while (at < line.length && isWhitespace(line[at])) at += 1;
    return line[at] === ":" ? at : -1;
}

function parseYaml(text: string): DeckConfig {
    const out: DeckConfig = {};
    for (const line of text.split("\n")) {
        const colon = isKeyColon(line);
        if (colon < 0) continue;
        out[line.slice(0, colon).trimEnd()] = stripQuotes(line.slice(colon + 1).trim());
    }
    return out;
}

function looksYaml(text: string): boolean {
    const lines = text.split("\n").filter((line) => line.trim());
    return lines.length > 0 && lines.every((line) => isKeyColon(line) >= 0 || isWhitespace(line.charAt(0)));
}

function hasAsciiAlnum(text: string): boolean {
    for (const ch of text) {
        if (ch >= "a" && ch <= "z") return true;
        if (ch >= "A" && ch <= "Z") return true;
        if (ch >= "0" && ch <= "9") return true;
    }
    return false;
}

// Approximates Unicode's Extended_Pictographic over the blocks a deck author types, enough to keep a decorative
// leading emoji line out of the prose without pulling in the full property table.
function hasPictographic(text: string): boolean {
    for (const ch of text) {
        const cp = ch.codePointAt(0) ?? 0;
        if (cp >= 0x1F000 && cp <= 0x1FAFF) return true;
        if (cp >= 0x2600 && cp <= 0x27BF) return true;
        if (cp >= 0x2B00 && cp <= 0x2BFF) return true;
        if (cp === 0x203C || cp === 0x2049) return true;
    }
    return false;
}

function isEmojiOnly(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed === "" || hasAsciiAlnum(trimmed) || Array.from(trimmed).length > 8) return false;
    return hasPictographic(trimmed);
}

// A `#`/`##` heading's title, or null -- `###` and deeper are cards, not slide titles, so the run must be 1-2.
function headingTitle(line: string): string | null {
    let hashes = 0;
    while (line[hashes] === "#") hashes += 1;
    if (hashes < 1 || hashes > 2 || !isWhitespace(line[hashes] ?? "")) return null;
    return line.slice(hashes).trim();
}

function extractParts(body: string): { title: string | null, emojis: Array<string>, rest: string } {
    const lines = body.split("\n");
    const emojis: Array<string> = [];
    while (lines.length > 0 && (!(lines[0] ?? "").trim() || isEmojiOnly(lines[0] ?? ""))) {
        const first = lines.shift() ?? "";
        if (isEmojiOnly(first)) emojis.push(first.trim());
    }
    let title: string | null = null;
    for (let i = 0; i < lines.length; i++) {
        const candidate = headingTitle(lines[i] ?? "");
        if (candidate !== null) {
            title = candidate;
            lines.splice(i, 1);
            break;
        }
    }
    return { title, emojis, rest: lines.join("\n").trim() };
}

// A fence body's non-empty trimmed lines, and one line's `|`-separated trimmed cells -- shared by the row parsers.
function contentLines(content: string): Array<string> {
    return content.split("\n").map((line) => line.trim()).filter(Boolean);
}

function cellsOf(line: string): Array<string> {
    return line.split("|").map((cell) => cell.trim());
}

function parseMetricRows(content: string): Array<MetricRow> {
    return contentLines(content).map((line) => {
        const parts = cellsOf(line);
        return { value: parts[0] ?? "", label: parts[1] ?? "", sub: parts[2] ?? "" };
    });
}

function parseBarRows(content: string): Array<BarRow> {
    return contentLines(content).map((line) => {
        const parts = cellsOf(line);
        return {
            label: parts[0] ?? "",
            tag: parts[1] ?? "",
            percent: parseFloat(parts[2] ?? "0") || 0
        };
    });
}

// `ChartKind`'s values are exactly the fence tags (```chart line), so the enum is the list of supported types.
const isChartKind = memberGuard<ChartKind>(Object.values(ChartKind));

// A chart fence is bare `chart` (grouped bars) or `chart <type>` for a known `ChartKind`. A different fence lang or
// an unknown type is `null` -- not a chart -- so the caller renders it as a code block rather than guessing bars.
function chartFenceKind(lang: string): ChartKind | null {
    if (!lang.startsWith(BlockKind.Chart)) return null;
    const tag = lang.slice(BlockKind.Chart.length);
    if (tag === "") return ChartKind.Bars;
    if (!tag.startsWith(" ")) return null;
    const kind = tag.slice(1);
    if (!isChartKind(kind)) return null;
    return kind;
}

// The header row names the series (its leading cell is the axis corner, dropped); each later row is a category
// followed by one numeric cell per series.
function parseChartData(kind: ChartKind, content: string): ChartData {
    const lines = contentLines(content);
    const header = cellsOf(lines[0] ?? "");
    const series: Array<ChartSeries> = header.slice(1).map((name) => ({ name, values: [] }));
    const categories: Array<string> = [];
    for (const line of lines.slice(1)) {
        const cells = cellsOf(line);
        categories.push(cells[0] ?? "");
        series.forEach((entry, index) => entry.values.push(parseFloat(cells[index + 1] ?? "0") || 0));
    }
    return { kind, categories, series };
}

// Each `::right::` starts the next column; the text before the first is already the first column.
function splitColumns(text: string): Array<string> {
    const segments: Array<string> = [];
    let column: Array<string> = [];
    for (const line of text.split("\n")) {
        if (line.trimEnd() === "::right::") {
            segments.push(column.join("\n"));
            column = [];
        } else column.push(line);
    }
    segments.push(column.join("\n"));
    return segments;
}

function hasColumnBreak(text: string): boolean {
    for (const line of text.split("\n")) if (line.trimEnd() === "::right::") return true;
    return false;
}

function blankLineGroups(text: string): Array<string> {
    const groups: Array<string> = [];
    let group: Array<string> = [];
    for (const line of text.split("\n")) {
        if (line.trim() !== "") group.push(line);
        else if (group.length > 0) {
            groups.push(group.join("\n"));
            group = [];
        }
    }
    if (group.length > 0) groups.push(group.join("\n"));
    return groups;
}

// A blank line ends the column row and resets the origin, so each `::right::` group is its own block and any
// content after the blank line flows full-width below rather than falling into the last column.
function parseColumnGroups(text: string): Array<Block> {
    const blocks: Array<Block> = [];
    for (const group of blankLineGroups(text)) {
        if (hasColumnBreak(group))
            blocks.push({ kind: BlockKind.Columns, columns: splitColumns(group).map((segment) => parseBlocks(segment.trim())) });
        else for (const block of parseBlocks(group)) blocks.push(block);
    }
    return blocks;
}

function parseBlocks(text: string): Array<Block> {
    if (hasColumnBreak(text)) return parseColumnGroups(text);
    if (hasHtmlBlock(text)) return [ { kind: BlockKind.Html, markup: text } ];

    const blocks: Array<Block> = [];
    for (const raw of tokenize(text)) {
        if (raw.kind === RawBlockKind.Cards)
            blocks.push({ kind: BlockKind.Cards, cards: raw.cards });
        else if (raw.kind === RawBlockKind.Fence) {
            if (raw.lang === "metrics") blocks.push({ kind: BlockKind.Metrics, rows: parseMetricRows(raw.content) });
            else if (raw.lang === "bars") blocks.push({ kind: BlockKind.Bars, rows: parseBarRows(raw.content) });
            else if (isFormulaNotation(raw.lang)) {
                blocks.push({
                    kind: BlockKind.Formula,
                    notation: raw.lang,
                    source: raw.content.trim()
                });
            } else {
                const chartKind = chartFenceKind(raw.lang);
                if (chartKind !== null) blocks.push({ kind: BlockKind.Chart, chart: parseChartData(chartKind, raw.content) });
                else blocks.push({ kind: BlockKind.Code, lang: raw.lang, content: raw.content });
            }
        } else
            blocks.push({ kind: BlockKind.Prose, markdown: raw.content });
    }
    return blocks;
}

// The closing fence is sought past the opener, so a body that itself opens with `---` is not mistaken for the close.
function frontMatterEnd(src: string): { config: string, bodyStart: number } | null {
    if (!src.startsWith("---\n")) return null;
    const close = src.indexOf("\n---\n", 4);
    if (close < 0) return null;
    return { config: src.slice(4, close), bodyStart: close + 5 };
}

// `ParseDeck<S>` narrows the built `Deck` to the precise IR for a string literal (a runtime `string` widens
// straight back to `Deck`), so the assertion only sharpens the type, never contradicts the value.
export function parse<const S extends string>(source: S): ParseDeck<S> {
    const src = source.split("\r\n").join("\n");
    let config: DeckConfig = {};
    let body = src;
    const head = frontMatterEnd(src);
    if (head !== null) {
        config = parseYaml(head.config);
        body = src.slice(head.bodyStart);
    }

    const parts = body.split("\n---\n");
    const slides: Array<Slide> = [];
    let i = 0;
    while (i < parts.length) {
        const chunk = parts[i] ?? "";
        const next = parts.at(i + 1);
        let frontmatter: DeckConfig = {};
        let raw: string;
        if (looksYaml(chunk) && next !== undefined) {
            frontmatter = parseYaml(chunk);
            raw = next;
            i += 2;
        } else {
            raw = chunk;
            i += 1;
        }
        if (!raw.trim()) continue;
        const { title, emojis, rest } = extractParts(raw.trim());
        slides.push({ frontmatter, title, emojis, blocks: parseBlocks(rest) });
    }

    return { config, slides } as ParseDeck<S>;
}

export function slideStarts(source: string): Array<number> {
    const src = source.split("\r\n").join("\n");
    const head = frontMatterEnd(src);
    const bodyStart = head === null ? 0 : head.bodyStart;

    const separator = "\n---\n";
    const parts: Array<{ text: string, start: number }> = [];
    let cursor = bodyStart;
    let at = src.indexOf(separator, cursor);
    while (at >= 0) {
        parts.push({ text: src.slice(cursor, at), start: cursor });
        cursor = at + separator.length;
        at = src.indexOf(separator, cursor);
    }
    parts.push({ text: src.slice(cursor), start: cursor });

    const starts: Array<number> = [];
    let i = 0;
    while (i < parts.length) {
        const chunk = parts[i];
        const next = parts.at(i + 1);
        let content = chunk;
        let step = 1;
        if (looksYaml(chunk.text) && next !== undefined) {
            content = next;
            step = 2;
        }
        i += step;
        if (!content.text.trim()) continue;
        starts.push(chunk.start);
    }
    return starts;
}
