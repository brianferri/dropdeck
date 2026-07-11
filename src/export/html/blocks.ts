import { code, div, h3, parse, pre, sanitize, span, text } from "#/dom";
import { NodeField, element } from "@dropdeck/html";
import { parse as parseMath } from "@dropdeck/math";
import { parse as parseLatex } from "@dropdeck/latex";
import { gridCols, metricCols } from "#/layout";
import { chartNode } from "#/export/html/chart";
import { renderMarkdown } from "#/render/html";
import { convertFences } from "#/render/markdown";
import { lowerLatex, lowerMath, toMathML } from "#/formula";
import { BlockKind, FormulaNotation } from "#/ir";
import type { Child, DomNode, ElementNode } from "#/dom";
import type { Node as XmlNode } from "@dropdeck/xml";
import type { Block, BarRow, Card, MetricRow } from "#/ir";

// A deck's Markdown may carry raw HTML; sanitize so an untrusted deck cannot inject script into the live page
// or a shared exported file.
function markupNodes(html: string): Array<DomNode> {
    return sanitize(parse(html));
}

// Animating each top-level node individually rather than through a shared wrapper lets a morph glide one
// while the other still fades.
function withReveal(nodes: ReadonlyArray<DomNode>): Array<DomNode> {
    return nodes.map((node) => {
        if (NodeField.Text in node) return node;
        const kind = node.tag === "video" || node.tag === "audio" ? "media" : "reveal";
        return element(node.tag, node.attrs.concat([["data-animation", kind] as const]), node.children);
    });
}

function cardsNode(cards: ReadonlyArray<Card>): ElementNode<"div"> {
    const items = cards.map((card) => div({ class: "panel", data: { animation: "reveal" } }, h3({}, card.title), markupNodes(renderMarkdown(card.body))));
    return div({ class: `grid grid-cols-${gridCols(cards.length)} gap-5 mt-2` }, items);
}

function metricsNode(rows: ReadonlyArray<MetricRow>): ElementNode<"div"> {
    const cells = rows.map((row) => {
        // An integer value seeds a `0` the count-up animation tweens up to its target.
        const value: Child = (/^\d+$/).test(row.value) ? span({ data: { count: row.value, animation: "counter" } }, "0") : row.value;
        return div(
            { class: "metric", data: { animation: "reveal" } },
            div({ class: "m-label" }, row.label),
            div({ class: "m-value" }, value),
            div({ class: "m-sub" }, row.sub)
        );
    });
    return div({ class: `grid grid-cols-${metricCols(rows.length)} gap-5 mt-2` }, cells);
}

function barsNode(rows: ReadonlyArray<BarRow>): ElementNode<"div"> {
    const items = rows.map((row) => div(
        { class: "bar-row" },
        div({ class: "bar-head" }, span({ class: "lab" }, row.label), span({ class: "tag" }, row.tag)),
        div({ class: "bar-track" }, div({ class: "bar-fill", data: { width: String(row.percent), animation: "bars" } }))
    ));
    return div({ class: "panel mt-2", data: { animation: "reveal" } }, items);
}

function codeNode(content: string): ElementNode<"div"> {
    return div({ class: "code-block mt-3", data: { animation: "reveal" } }, pre({}, code({}, content)));
}

function mathmlToDom(node: XmlNode): DomNode {
    if (NodeField.Text in node) return text(node.text);
    return element(node.tag, node.attrs.map(([name, value]) => [name, String(value)] as const), node.children.map(mathmlToDom));
}

function formulaMathML(notation: FormulaNotation, source: string): XmlNode {
    if (notation === FormulaNotation.Latex) return toMathML(lowerLatex(parseLatex(source)));
    return toMathML(lowerMath(parseMath(source)));
}

function formulaNode(notation: FormulaNotation, source: string): ElementNode<"div"> {
    try {
        return div({ class: "formula mt-3", data: { animation: "reveal" } }, mathmlToDom(formulaMathML(notation, source)));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return div(
            { class: "formula formula-error mt-3", data: { animation: "reveal" } },
            div({ class: "formula-error-src" }, source),
            div({ class: "formula-error-msg" }, message)
        );
    }
}

function proseNode(markdown: string): ElementNode<"div"> {
    return div({ class: "mt-3" }, withReveal(markupNodes(renderMarkdown(markdown))));
}

function htmlNode(markup: string): ElementNode<"div"> {
    return div({}, withReveal(markupNodes(renderMarkdown(convertFences(markup)))));
}

function columnsNode(columns: ReadonlyArray<ReadonlyArray<Block>>): ElementNode<"div"> {
    const cells = columns.map((column) => div({}, renderBlocks(column)));
    return div({ class: `grid grid-cols-${columns.length} gap-8 mt-2 items-start` }, cells);
}

export function renderBlock(block: Block): DomNode {
    switch (block.kind) {
        case BlockKind.Prose:
            return proseNode(block.markdown);
        case BlockKind.Html:
            return htmlNode(block.markup);
        case BlockKind.Cards:
            return cardsNode(block.cards);
        case BlockKind.Metrics:
            return metricsNode(block.rows);
        case BlockKind.Bars:
            return barsNode(block.rows);
        case BlockKind.Chart:
            return chartNode(block.chart);
        case BlockKind.Code:
            return codeNode(block.content);
        case BlockKind.Formula:
            return formulaNode(block.notation, block.source);
        case BlockKind.Columns:
            return columnsNode(block.columns);
    }
}

export function renderBlocks(blocks: ReadonlyArray<Block>): Array<DomNode> {
    return blocks.map(renderBlock);
}
