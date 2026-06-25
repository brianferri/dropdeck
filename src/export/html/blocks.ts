import { code, div, h3, parse, pre, sanitize, span } from "#/dom";
import { gridCols, metricCols } from "#/layout";
import { renderMarkdown } from "#/render/html";
import { convertFences } from "#/render/markdown";
import { BlockKind } from "#/ir";
import type { Child, DomNode, ElementNode } from "#/dom";
import type { Block, BarRow, Card, MetricRow } from "#/ir";

// A deck's Markdown may carry raw HTML; sanitize so an untrusted deck cannot inject script into the live page
// or a shared exported file.
function markupNodes(html: string): Array<DomNode> {
    return sanitize(parse(html));
}

function cardsNode(cards: ReadonlyArray<Card>): ElementNode<"div"> {
    const items = cards.map((card) => div({ class: "panel reveal" }, h3({}, card.title), markupNodes(renderMarkdown(card.body))));
    return div({ class: `grid grid-cols-${gridCols(cards.length)} gap-5 mt-2` }, items);
}

function metricsNode(rows: ReadonlyArray<MetricRow>): ElementNode<"div"> {
    const cells = rows.map((row) => {
        // An integer value seeds a `0` the count-up animation tweens up to its target.
        const value: Child = (/^\d+$/).test(row.value) ? span({ data: { count: row.value } }, "0") : row.value;
        return div(
            { class: "metric reveal" },
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
        div({ class: "bar-track" }, div({ class: "bar-fill", data: { width: String(row.percent) } }))
    ));
    return div({ class: "panel reveal mt-2" }, items);
}

function codeNode(content: string): ElementNode<"div"> {
    return div({ class: "code-block reveal mt-3" }, pre({}, code({}, content)));
}

function proseNode(markdown: string): ElementNode<"div"> {
    const html = renderMarkdown(markdown);
    const boxed = (/<ul|<ol/).test(html);
    return div({ class: boxed ? "panel reveal mt-3" : "reveal mt-3" }, markupNodes(html));
}

function htmlNode(markup: string): ElementNode<"div"> {
    return div({ class: "reveal" }, markupNodes(renderMarkdown(convertFences(markup))));
}

function columnsNode(left: ReadonlyArray<Block>, right: ReadonlyArray<Block>): ElementNode<"div"> {
    return div(
        { class: "grid grid-cols-2 gap-8 mt-2 items-start" },
        div({}, renderBlocks(left)),
        div({}, renderBlocks(right))
    );
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
        case BlockKind.Code:
            return codeNode(block.content);
        case BlockKind.Columns:
            return columnsNode(block.left, block.right);
    }
}

export function renderBlocks(blocks: ReadonlyArray<Block>): Array<DomNode> {
    return blocks.map(renderBlock);
}
