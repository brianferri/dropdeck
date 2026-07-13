import { has } from "./Support.js";
import { ATX_LEVEL_MAX, ListDelimiter, ListMarker, NodeKind } from "./Specification.js";
import type { BlockNode, Blocks, HeadingLevel, InlineNode, Inlines, ListItemNode } from "./typings/nodes.js";
import type { Parse } from "./typings/parse.js";

type Lines = ReadonlyArray<string>;
type InlineMatch = { readonly node: InlineNode, readonly end: number };
type Marker = { readonly ordered: boolean, readonly start: number, readonly delimiter: ListMarker | ListDelimiter, readonly width: number };

const ESCAPABLE = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

function textRun(value: string): Inlines {
    return value === "" ? [] : [ { kind: NodeKind.Text, value } ];
}

function escapeMatch(text: string, at: number): InlineMatch | null {
    const next = text.at(at + 1);
    if (next === undefined || !ESCAPABLE.includes(next)) return null;
    return { node: { kind: NodeKind.Text, value: next }, end: at + 2 };
}

const ENTITIES = {
    amp: 38,
    lt: 60,
    gt: 62,
    quot: 34,
    apos: 39,
    nbsp: 0xa0,
    copy: 0xa9,
    reg: 0xae,
    trade: 0x2122,
    deg: 0xb0,
    middot: 0xb7,
    bull: 0x2022,
    hellip: 0x2026,
    mdash: 0x2014,
    ndash: 0x2013,
    lsquo: 0x2018,
    rsquo: 0x2019,
    ldquo: 0x201c,
    rdquo: 0x201d,
    laquo: 0xab,
    raquo: 0xbb,
    times: 0xd7,
    divide: 0xf7,
    plusmn: 0xb1,
    ge: 0x2265,
    le: 0x2264,
    ne: 0x2260,
    rarr: 0x2192,
    larr: 0x2190,
    uarr: 0x2191,
    darr: 0x2193,
    harr: 0x2194
} as const;

// CommonMark decodes entity and numeric character references in text (`&mdash;` -> em dash). An unknown name or
// a missing `;` is left literal, so `inlineAt` falls through and the `&` stays plain text.
function entityMatch(text: string, at: number): InlineMatch | null {
    const semicolon = text.indexOf(";", at + 1);
    if (semicolon < 0 || semicolon - at > 32) return null;
    const name = text.slice(at + 1, semicolon);
    if (name.startsWith("#")) {
        const hex = name[1] === "x" || name[1] === "X";
        const code = parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
        if (Number.isNaN(code) || code <= 0 || code > 0x10ffff) return null;
        return { node: { kind: NodeKind.Text, value: String.fromCodePoint(code) }, end: semicolon + 1 };
    }
    if (!has(name, ENTITIES)) return null;
    return { node: { kind: NodeKind.Text, value: String.fromCodePoint(ENTITIES[name]) }, end: semicolon + 1 };
}

function codeMatch(text: string, at: number): InlineMatch | null {
    const close = text.indexOf("`", at + 1);
    if (close < 0) return null;
    return { node: { kind: NodeKind.Code, value: text.slice(at + 1, close) }, end: close + 1 };
}

function emphasisMatch(text: string, at: number, mark: string, kind: NodeKind.Emphasis | NodeKind.Strong): InlineMatch | null {
    const close = text.indexOf(mark, at + mark.length);
    if (close < 0 || close === at + mark.length) return null;
    return { node: { kind, children: parseInlines(text.slice(at + mark.length, close)) }, end: close + mark.length };
}

function linkMatch(text: string, at: number, image: boolean): InlineMatch | null {
    const labelStart = at + (image ? 2 : 1);
    const labelEnd = text.indexOf("]", labelStart);
    if (labelEnd < 0 || !text.startsWith("(", labelEnd + 1)) return null;
    const destEnd = text.indexOf(")", labelEnd + 2);
    if (destEnd < 0) return null;
    const children = parseInlines(text.slice(labelStart, labelEnd));
    const kind = image ? NodeKind.Image : NodeKind.Link;
    return { node: { kind, destination: text.slice(labelEnd + 2, destEnd), title: "", children }, end: destEnd + 1 };
}

function autolinkMatch(text: string, at: number): InlineMatch | null {
    const close = text.indexOf(">", at + 1);
    if (close < 0) return null;
    const uri = text.slice(at + 1, close);
    if (!uri.includes(":") || uri.includes(" ")) return null;
    return { node: { kind: NodeKind.Link, destination: uri, title: "", children: [ { kind: NodeKind.Text, value: uri } ] }, end: close + 1 };
}

function isTagStart(ch: string | undefined): boolean {
    if (ch === undefined) return false;
    if (ch >= "a" && ch <= "z") return true;
    if (ch >= "A" && ch <= "Z") return true;
    return ch === "/" || ch === "!" || ch === "?";
}

// A raw inline HTML tag/comment is passed through verbatim. A `<` that does not open one (e.g. `a < b`) stays
// literal text, so `inlineAt` falls through to the plain run.
function htmlInlineMatch(text: string, at: number): InlineMatch | null {
    if (!isTagStart(text.at(at + 1))) return null;
    const close = text.indexOf(">", at + 1);
    if (close < 0) return null;
    return { node: { kind: NodeKind.HtmlInline, value: text.slice(at, close + 1) }, end: close + 1 };
}

function inlineAt(text: string, at: number): InlineMatch | null {
    if (text.startsWith("\\", at)) return escapeMatch(text, at);
    if (text.startsWith("\n", at)) return { node: { kind: NodeKind.SoftBreak }, end: at + 1 };
    if (text.startsWith("`", at)) return codeMatch(text, at);
    if (text.startsWith("**", at)) return emphasisMatch(text, at, "**", NodeKind.Strong);
    if (text.startsWith("*", at)) return emphasisMatch(text, at, "*", NodeKind.Emphasis);
    if (text.startsWith("_", at)) return emphasisMatch(text, at, "_", NodeKind.Emphasis);
    if (text.startsWith("![", at)) return linkMatch(text, at, true);
    if (text.startsWith("[", at)) return linkMatch(text, at, false);
    if (text.startsWith("<", at)) return autolinkMatch(text, at) ?? htmlInlineMatch(text, at);
    if (text.startsWith("&", at)) return entityMatch(text, at);
    return null;
}

// `match.end` always exceeds the index, so the scan terminates within the text; nested inlines recurse through
// the construct matchers, bounded by nesting depth.
export function parseInlines(text: string): Inlines {
    const nodes: Array<InlineNode> = [];
    let run = 0;
    let index = 0;
    while (index < text.length) {
        const match = inlineAt(text, index);
        if (match === null) {
            index += 1;
            continue;
        }
        for (const node of textRun(text.slice(run, index))) nodes.push(node);
        nodes.push(match.node);
        run = match.end;
        index = match.end;
    }
    for (const node of textRun(text.slice(run))) nodes.push(node);
    return nodes;
}

function isThematicBreak(line: string): boolean {
    const bare = Array.from(line).filter((ch) => ch !== " ");
    if (bare.length < 3) return false;
    return bare.every((ch) => ch === "-") || bare.every((ch) => ch === "_") || bare.every((ch) => ch === "*");
}

function atxLevel(line: string): number {
    const firstOther = Array.from(line).findIndex((ch) => ch !== "#");
    const level = firstOther < 0 ? line.length : firstOther;
    const after = line.at(level);
    return level >= 1 && level <= ATX_LEVEL_MAX && (after === " " || after === undefined) ? level : 0;
}

function setextLevel(line: string): number {
    const bare = Array.from(line.trim());
    if (bare.length === 0) return 0;
    if (bare.every((ch) => ch === "=")) return 1;
    if (bare.every((ch) => ch === "-")) return 2;
    return 0;
}

function markerAt(line: string): Marker | null {
    if (line.startsWith("- ")) return { ordered: false, start: 1, delimiter: ListMarker.Dash, width: 2 };
    if (line.startsWith("* ")) return { ordered: false, start: 1, delimiter: ListMarker.Asterisk, width: 2 };
    if (line.startsWith("+ ")) return { ordered: false, start: 1, delimiter: ListMarker.Plus, width: 2 };
    const firstOther = Array.from(line).findIndex((ch) => ch < "0" || ch > "9");
    const digits = firstOther < 0 ? 0 : firstOther;
    if (digits < 1 || digits > 9) return null;
    const start = Number(line.slice(0, digits));
    if (line.startsWith(". ", digits)) return { ordered: true, start, delimiter: ListDelimiter.Period, width: digits + 2 };
    if (line.startsWith(") ", digits)) return { ordered: true, start, delimiter: ListDelimiter.Paren, width: digits + 2 };
    return null;
}

function dedent(line: string, width: number): string {
    const firstOther = Array.from(line).findIndex((ch) => ch !== " ");
    const spaces = firstOther < 0 ? line.length : firstOther;
    return line.slice(Math.min(spaces, width));
}

function trimTrailingNewlines(value: string): string {
    let end = value.length;
    while (end > 0 && value[end - 1] === "\n") end -= 1;
    return value.slice(0, end);
}

function fenceClose(lines: Lines, at: number): number {
    let index = at;
    while (index < lines.length && !lines[index].startsWith("```")) index += 1;
    return index;
}

function indentedEnd(lines: Lines, at: number): number {
    let index = at;
    while (index < lines.length && (lines[index].startsWith("    ") || lines[index].trim() === "")) index += 1;
    return index;
}

function quoteEnd(lines: Lines, at: number): number {
    let index = at;
    while (index < lines.length && lines[index].startsWith(">")) index += 1;
    return index;
}

function paragraphEnd(lines: Lines, at: number): number {
    let index = at;
    while (index < lines.length) {
        const line = lines[index];
        if (line.trim() === "") break;
        if (isThematicBreak(line) || atxLevel(line) > 0 || line.startsWith("```") || line.startsWith(">")) break;
        if (markerAt(line) !== null || setextLevel(line) > 0) break;
        index += 1;
    }
    return index;
}

function listEnd(lines: Lines, at: number): number {
    let index = at;
    while (index < lines.length) {
        const line = lines[index];
        if (markerAt(line) !== null || line.startsWith(" ")) {
            index += 1;
            continue;
        }
        if (line.trim() !== "") break;
        const next = lines.at(index + 1);
        if (next === undefined) break;
        if (markerAt(next) === null && !next.startsWith(" ")) break;
        index += 1;
    }
    return index;
}

function itemEnd(lines: Lines, at: number, limit: number): number {
    let index = at;
    while (index < limit) {
        const marker = markerAt(lines[index]);
        if (marker !== null && !lines[index].startsWith(" ")) break;
        index += 1;
    }
    return index;
}

function buildItems(lines: Lines, at: number, limit: number): ReadonlyArray<ListItemNode> {
    const items: Array<ListItemNode> = [];
    let index = at;
    while (index < limit) {
        const marker = markerAt(lines[index]);
        const width = marker?.width ?? 2;
        const bodyEnd = itemEnd(lines, index + 1, limit);
        const head = lines[index].slice(width);
        const tail = lines.slice(index + 1, bodyEnd).map((line) => dedent(line, width));
        items.push({ kind: NodeKind.ListItem, children: parseBlockLines([head].concat(tail)) });
        index = bodyEnd;
    }
    return items;
}

function listBlock(lines: Lines, at: number): { readonly block: BlockNode, readonly next: number } {
    const marker = markerAt(lines[at]);
    const end = listEnd(lines, at);
    const region = lines.slice(at, Math.max(at, end - 1));
    const tight = !region.some((line) => line.trim() === "");
    const block: BlockNode = {
        kind: NodeKind.List,
        ordered: marker?.ordered ?? false,
        start: marker?.start ?? 1,
        tight,
        marker: marker?.delimiter ?? ListMarker.Dash,
        children: buildItems(lines, at, end)
    };
    return { block, next: end };
}

function paragraphOrSetext(lines: Lines, at: number): { readonly block: BlockNode, readonly next: number } {
    const end = paragraphEnd(lines, at + 1);
    const underline = lines.at(end);
    const text = lines.slice(at, end).join("\n").trim();
    if (underline !== undefined && setextLevel(underline) > 0)
        return { block: { kind: NodeKind.Heading, level: setextLevel(underline) as HeadingLevel, children: parseInlines(text) }, next: end + 1 };

    return { block: { kind: NodeKind.Paragraph, children: parseInlines(text) }, next: end };
}

const RAW_HTML_TAGS = ["pre", "script", "style", "textarea"];

function htmlBlockStart(line: string): boolean {
    if (!line.startsWith("<")) return false;
    if (line.startsWith("<!--")) return true;
    const after = line.charAt(line[1] === "/" ? 2 : 1);
    return (after >= "a" && after <= "z") || (after >= "A" && after <= "Z");
}

function openTagName(line: string): string {
    let index = 1;
    while (index < line.length && ((line[index] >= "a" && line[index] <= "z") || (line[index] >= "A" && line[index] <= "Z"))) index += 1;
    return line.slice(1, index).toLowerCase();
}

function blankLineFrom(lines: Lines, at: number): number {
    let index = at;
    while (index < lines.length && lines[index].trim() !== "") index += 1;
    return index;
}

function closingLineFrom(lines: Lines, at: number, marker: string): number {
    let index = at;
    while (index < lines.length && !lines[index].includes(marker)) index += 1;
    return index < lines.length ? index + 1 : index;
}

// A line opening with `<tag`/`</tag`/`<!--` begins a raw HTML block. `<pre>`/`<script>`/`<style>`/`<textarea>`
// and comments run to their closing marker so their (possibly blank-line-containing) body stays raw; any other
// tag block ends at the next blank line, leaving Markdown after that blank line to parse again.
function htmlBlock(lines: Lines, at: number): { readonly block: BlockNode, readonly next: number } | null {
    const line = lines[at];
    if (!htmlBlockStart(line)) return null;
    let end: number;
    if (line.startsWith("<!--")) end = closingLineFrom(lines, at, "-->");
    else {
        const tag = openTagName(line);
        end = RAW_HTML_TAGS.includes(tag) ? closingLineFrom(lines, at, `</${tag}>`) : blankLineFrom(lines, at);
    }
    return { block: { kind: NodeKind.HtmlBlock, literal: lines.slice(at, end).join("\n") }, next: end };
}

function blockAt(lines: Lines, at: number): { readonly block: BlockNode, readonly next: number } {
    const line = lines[at];
    if (line.startsWith("    ")) {
        const end = indentedEnd(lines, at);
        const literal = trimTrailingNewlines(lines.slice(at, end).map((code) => code.slice(4)).join("\n"));
        return { block: { kind: NodeKind.CodeBlock, fenced: false, info: "", literal }, next: end };
    }
    if (isThematicBreak(line)) return { block: { kind: NodeKind.ThematicBreak }, next: at + 1 };
    const level = atxLevel(line);
    if (level > 0) return { block: { kind: NodeKind.Heading, level: level as HeadingLevel, children: parseInlines(line.slice(level).trim()) }, next: at + 1 };
    if (line.startsWith("```")) {
        const close = fenceClose(lines, at + 1);
        return { block: { kind: NodeKind.CodeBlock, fenced: true, info: line.slice(3).trim(), literal: lines.slice(at + 1, close).join("\n") }, next: close < lines.length ? close + 1 : close };
    }
    const html = htmlBlock(lines, at);
    if (html !== null) return html;
    if (line.startsWith(">")) {
        const end = quoteEnd(lines, at);
        const stripped = lines.slice(at, end).map((quoted) => (quoted.startsWith("> ") ? quoted.slice(2) : quoted.slice(1)));
        return { block: { kind: NodeKind.BlockQuote, children: parseBlockLines(stripped) }, next: end };
    }
    if (markerAt(line) !== null) return listBlock(lines, at);
    return paragraphOrSetext(lines, at);
}

// Each block consumes through its `next`, which `blockAt` always advances past `index`, so the walk covers the
// lines once. Nested blocks (quotes, list items) recurse through `parseBlockLines`, bounded by nesting depth.
export function parseBlockLines(lines: Lines): Blocks {
    const blocks: Array<BlockNode> = [];
    let index = 0;
    while (index < lines.length) {
        if (lines[index].trim() === "") {
            index += 1;
            continue;
        }
        const { block, next } = blockAt(lines, index);
        blocks.push(block);
        index = next;
    }
    return blocks;
}

// The cast is sound by construction: the runtime classifies each line exactly as the type-level `Parse` does,
// so the built tree is the one `Parse<S>` computes for a string literal (a widened `string` degrades to `Document`).
export function parse<const S extends string>(source: S): Parse<S> {
    return { kind: NodeKind.Document, children: parseBlockLines(source.split("\r\n").join("\n").split("\n")) } as Parse<S>;
}
