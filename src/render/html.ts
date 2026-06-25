import { NodeKind, parse, parseInlines } from "@dropdeck/markdown";
import { a, blockquote, br, code, em, h1, h2, h3, h4, h5, h6, hr, img, li, ol, p, parse as parseHtml, pre, serialize, strong, table, tbody, td, text, th, thead, tr, ul } from "#/dom";
import { declaration } from "@dropdeck/html/css";
import { fixHtml } from "#/render/markdown";
import type { BlockNode, Blocks, InlineNode, Inlines, ListItemNode, ListNode } from "@dropdeck/markdown";
import type { DomNode } from "#/dom";

const HEADINGS = [h1, h2, h3, h4, h5, h6];

type Inline = Exclude<InlineNode, { kind: NodeKind.HtmlInline }>;
type Block = Exclude<BlockNode, { kind: NodeKind.HtmlBlock }>;

function inlineText(nodes: Inlines): string {
    let out = "";
    for (const node of nodes) {
        if (node.kind === NodeKind.Text || node.kind === NodeKind.Code) out += node.value;
        else if (node.kind === NodeKind.Emphasis || node.kind === NodeKind.Strong || node.kind === NodeKind.Link || node.kind === NodeKind.Image) out += inlineText(node.children);
    }
    return out;
}

// Raw inline HTML passes through by re-parsing it to nodes; every other inline maps to a single node.
function inlineList(nodes: Inlines): Array<DomNode> {
    const out: Array<DomNode> = [];
    for (const node of nodes) {
        if (node.kind === NodeKind.HtmlInline) for (const html of parseHtml(node.value)) out.push(html);
        else out.push(inlineNode(node));
    }
    return out;
}

function inlineNode(node: Inline): DomNode {
    switch (node.kind) {
        case NodeKind.Text: return text(node.value);
        case NodeKind.SoftBreak: return text("\n");
        case NodeKind.HardBreak: return br({});
        case NodeKind.Code: return code({}, text(node.value));
        case NodeKind.Emphasis: return em({}, inlineList(node.children));
        case NodeKind.Strong: return strong({}, inlineList(node.children));
        case NodeKind.Link: {
            const children = inlineList(node.children);
            if (node.title) return a({ href: node.destination, title: node.title }, children);
            return a({ href: node.destination }, children);
        }
        case NodeKind.Image: {
            const alt = inlineText(node.children);
            if (node.title) return img({ src: node.destination, alt, title: node.title });
            return img({ src: node.destination, alt });
        }
    }
}

function blockList(blocks: Blocks): Array<DomNode> {
    const out: Array<DomNode> = [];
    for (const block of blocks) {
        if (block.kind === NodeKind.HtmlBlock) for (const html of parseHtml(block.literal)) out.push(html);
        else out.push(blockNode(block));
    }
    return out;
}

// A tight list item drops the paragraph wrapper so its text renders directly in the `<li>`, matching CommonMark.
function listItem(item: ListItemNode, tight: boolean): DomNode {
    if (!tight) return li({}, blockList(item.children));
    const nodes: Array<DomNode> = [];
    for (const block of item.children) {
        if (block.kind === NodeKind.Paragraph) for (const inline of inlineList(block.children)) nodes.push(inline);
        else if (block.kind === NodeKind.HtmlBlock) for (const html of parseHtml(block.literal)) nodes.push(html);
        else nodes.push(blockNode(block));
    }
    return li({}, nodes);
}

function listNode(node: ListNode): DomNode {
    const builder = node.ordered ? ol : ul;
    return builder({}, node.children.map((item) => listItem(item, node.tight)));
}

function blockNode(node: Block): DomNode {
    switch (node.kind) {
        case NodeKind.Paragraph: return p({}, inlineList(node.children));
        case NodeKind.Heading: return (HEADINGS[node.level - 1] ?? h6)({}, inlineList(node.children));
        case NodeKind.ThematicBreak: return hr({});
        case NodeKind.CodeBlock:
            return pre({}, node.info ? code({ class: `language-${node.info}` }, text(node.literal)) : code({}, text(node.literal)));
        case NodeKind.BlockQuote: return blockquote({}, blockList(node.children));
        case NodeKind.List: return listNode(node);
        case NodeKind.ListItem: return listItem(node, false);
    }
}

// Top level interleaves raw HTML blocks (verbatim) with serialized Markdown, so split HTML still nests correctly.
function blocksHtml(blocks: Blocks): string {
    let out = "";
    for (const block of blocks) {
        if (block.kind === NodeKind.HtmlBlock) out += block.literal;
        else out += serialize(blockNode(block));
    }
    return out;
}

function splitRow(line: string): Array<string> {
    let inner = line.trim();
    if (inner.startsWith("|")) inner = inner.slice(1);
    if (inner.endsWith("|")) inner = inner.slice(0, -1);
    return inner.split("|").map((cell) => cell.trim());
}

function isDelimiterCell(cell: string): boolean {
    let inner = cell;
    if (inner.startsWith(":")) inner = inner.slice(1);
    if (inner.endsWith(":")) inner = inner.slice(0, -1);
    if (inner.length === 0) return false;
    for (const ch of inner) if (ch !== "-") return false;
    return true;
}

function isDelimiterRow(line: string): boolean {
    if (!line.includes("-")) return false;
    const cells = splitRow(line);
    if (cells.length === 0) return false;
    for (const cell of cells) if (!isDelimiterCell(cell)) return false;
    return true;
}

type CellAlign = "left" | "right" | "center";

function alignOf(cell: string): CellAlign | null {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
}

function headerCell(value: string, align: CellAlign | null): DomNode {
    const children = inlineList(parseInlines(value));
    if (align === null) return th({}, children);
    return th({ style: [declaration("text-align", align)] }, children);
}

function bodyCell(value: string, align: CellAlign | null): DomNode {
    const children = inlineList(parseInlines(value));
    if (align === null) return td({}, children);
    return td({ style: [declaration("text-align", align)] }, children);
}

// GFM tables are not CommonMark, so they are recognised here (a header row, a `---` delimiter, then body rows)
// rather than in the parser, and emitted as a `<table>` before the surrounding Markdown is rendered.
function tableAt(lines: ReadonlyArray<string>, start: number): { html: string, next: number } | null {
    if (start + 1 >= lines.length) return null;
    const header = lines[start];
    const delimiter = lines[start + 1];
    if (!header.includes("|") || !isDelimiterRow(delimiter)) return null;
    const headers = splitRow(header);
    const align = splitRow(delimiter).map(alignOf);
    if (align.length !== headers.length) return null;
    const headRow = tr({}, headers.map((value, index) => headerCell(value, align[index] ?? null)));
    const bodyRows: Array<DomNode> = [];
    let index = start + 2;
    while (index < lines.length && lines[index].includes("|") && lines[index].trim() !== "") {
        bodyRows.push(tr({}, splitRow(lines[index]).map((value, column) => bodyCell(value, align[column] ?? null))));
        index += 1;
    }
    return { html: serialize(table({}, [thead({}, [headRow]), tbody({}, bodyRows)])), next: index };
}

// Markdown to HTML by composing the two packages: `@dropdeck/markdown` parses to an AST, the `#/dom` builders
// rebuild it, and `serialize` emits the HTML -- with raw HTML passed through and GFM tables handled here.
export function renderMarkdown(source: string): string {
    const lines = fixHtml(source).split("\n");
    let out = "";
    let buffer: Array<string> = [];
    let index = 0;
    while (index < lines.length) {
        const found = tableAt(lines, index);
        if (found !== null) {
            if (buffer.length > 0) out += blocksHtml(parse(buffer.join("\n")).children);
            buffer = [];
            out += found.html;
            index = found.next;
        } else {
            buffer.push(lines[index]);
            index += 1;
        }
    }
    if (buffer.length > 0) out += blocksHtml(parse(buffer.join("\n")).children);
    return out;
}

// The inline-only parse, as DomNodes -- for callers (table cells) that style runs from the tree, not from HTML.
export function renderInlineNodes(source: string): ReadonlyArray<DomNode> {
    return inlineList(parseInlines(source));
}
