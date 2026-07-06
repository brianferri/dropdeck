import { HtmlTag, NodeField, attribute, childElements, findAll, findFirst, hasClass, parse, serialize, textContent } from "@dropdeck/html";
import { CssProperty, colorClass, columnSpan, gridColumns as tailwindGridColumns, resolve as resolveTailwind } from "@dropdeck/html/tailwind";
import { decompose, matrixOf, parseStyle, parseTransform, styleValue } from "@dropdeck/html/css";
import { Align, Anchor, idFactory, imageShape, leftBarFrame, panel, paragraphOf, pProps, relFactory, styledRun, textBox, txBodyOf } from "#/export/pptx/build";
import { PANEL_PAD, PANEL_RADIUS, glassPanel, lowered, runBox } from "#/export/pptx/lower";
import { lowerChart } from "#/export/pptx/chart";
import { inlineRuns, inlineRunsFromNodes, inlineSegments } from "#/export/pptx/inline";
import { resolveImage } from "#/export/pptx/image";
import { svgToShapes } from "#/export/pptx/svg-lower";
import { Motion } from "#/export/pptx/animations/timing";
import { morphName } from "#/animations/spec";
import { renderMarkdown } from "#/render/html";
import { barFraction, gridCols, metricCols } from "#/layout";
import { BlockKind } from "#/ir";
import type { AnimatedShapeRef, Embed, Lowered } from "#/export/pptx/lower";
import type { Content, DomNode, ElementNode } from "@dropdeck/html";
import type { Palette } from "#/export/pptx/palette";
import type { RunStyle } from "#/export/pptx/build";
import type { Block, BarRow, Card, MetricRow } from "#/ir";
import type { ColorClass } from "@dropdeck/html/tailwind";
import type { Node, SlideMedia } from "@dropdeck/pptx";

export type { AnimatedShapeRef, Embed } from "#/export/pptx/lower";

const GAP = 20;
const LINE = 26;
const SUB_LINE = 20;
const IMAGE_MAX_HEIGHT = 340;
const BLOCK_GAP = 14;
const CARD_TITLE_SIZE = 20;
const CARD_TITLE_LINE = 28;
// Bold runs wider than `lineCount`'s estimate, so overshoot a line of slack rather than overlap the body.
const CARD_TITLE_CHAR_WIDTH = 0.62;

// Order matters: a panel drawn before its content keeps painting behind it.
function combine(parts: ReadonlyArray<Lowered>, height: number): Lowered {
    const shapes: Array<Node> = [];
    const media: Array<SlideMedia> = [];
    const anim: Array<AnimatedShapeRef> = [];
    for (const part of parts) {
        for (const shape of part.shapes) shapes.push(shape);
        for (const entry of part.media) media.push(entry);
        for (const ref of part.anim) anim.push(ref);
    }
    return { shapes, height, media, anim };
}

function bodyStyle(palette: Palette): RunStyle {
    return { sizePx: 17, color: palette.secondary, font: palette.body };
}

// OOXML shapes have no auto-flow, so the vertical cursor advances by estimate; a coarse glyph width suffices.
function lineCount(text: string, widthPx: number, sizePx: number): number {
    const perLine = Math.max(1, Math.floor(widthPx / (sizePx * 0.52)));
    let lines = 0;
    for (const raw of text.split("\n")) lines += Math.max(1, Math.ceil(raw.length / perLine));
    return Math.max(1, lines);
}

function stackDown<T>(
    items: ReadonlyArray<T>,
    y: number,
    gap: number,
    skipEmpty: boolean,
    lower: (item: T, cursorY: number) => Lowered
): Lowered {
    const parts: Array<Lowered> = [];
    let cursorY = y;
    for (const item of items) {
        const part = lower(item, cursorY);
        if (skipEmpty && part.shapes.length === 0) continue;
        parts.push(part);
        cursorY += part.height + gap;
    }
    return combine(parts, Math.max(0, cursorY - y - gap));
}

function quotePanel(
    paragraphs: ReadonlyArray<Array<Node>>,
    lines: number,
    embed: Embed,
    x: number,
    y: number,
    width: number,
    align: Align
): Lowered {
    const { nextId, palette } = embed;
    const paras = paragraphs.map((runs) => paragraphOf(pProps(align, 0, 0), runs));
    const height = (lines * 28) + (2 * PANEL_PAD);
    const surface = glassPanel(nextId, x, y, width, height, palette, 16);
    // Inset from the rounded corners so the accent pill curves with them rather than running as a hard rectangle.
    const bar = panel(nextId, x + 5, y + 14, 6, height - 28, palette.accent1, 3, 100);
    const text = textBox(nextId, x + PANEL_PAD + 12, y + PANEL_PAD, width - (2 * PANEL_PAD) - 12, height - (2 * PANEL_PAD), txBodyOf(Anchor.Center, paras));
    return lowered([surface, bar, text], height);
}

function blockquoteEl(element: ElementNode, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    const { palette } = embed;
    const inner = childElements(element).filter((child) => child.tag === HtmlTag.P);
    const sources = inner.length > 0 ? inner : [element];
    const quoteStyle: RunStyle = { sizePx: 18, color: palette.secondary, font: palette.body };
    const paragraphs: Array<Array<Node>> = [];
    for (const source of sources) for (const segment of inlineSegments(source.children, quoteStyle, palette)) paragraphs.push(segment);
    let lines = 0;
    for (const source of sources) lines += lineCount(textContent(source), width - 40, 18);
    lines = Math.max(lines, paragraphs.length);
    return quotePanel(paragraphs, lines, embed, x, y, width, align);
}

function noteEl(element: ElementNode, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette } = embed;
    const accent = borderAccent(element, palette, palette.accent1);
    const base: RunStyle = { sizePx: 17, color: colorOf(element, palette, palette.secondary), font: palette.body, italic: hasClass(element, "italic") };
    const runs = inlineRunsFromNodes(element.children, base, palette);
    const minHeight = Math.max(20, lineCount(textContent(element), width - 24, 17) * 19);
    return lowered([leftBarFrame(nextId, x, y, width, minHeight, accent, runs)], minHeight + 8);
}

// A grid of separated rounded glass cells rather than a native table, which can't reproduce the deck's
// `border-spacing` plus rounded `td` look.
const TABLE_GAP = 8;
const TABLE_HEADER_HEIGHT = 28;
const TABLE_ROW_HEIGHT = 50;

function columnWidths(
    headers: ReadonlyArray<string>,
    rows: ReadonlyArray<ReadonlyArray<string>>,
    available: number
): Array<number> {
    const natural: Array<number> = [];
    for (let index = 0; index < headers.length; index += 1) {
        let charCountMax = (headers[index] ?? "").length;
        for (const row of rows) charCountMax = Math.max(charCountMax, (row[index] ?? "").length);
        natural.push((charCountMax * 15 * 0.58) + 28);
    }
    let total = 0;
    for (const value of natural) total += value;
    if (total >= available) return natural.map((value) => value * (available / total));
    const slack = (available - total) / natural.length;
    return natural.map((value) => value + slack);
}

function lowerTable(
    headers: ReadonlyArray<string>,
    rows: ReadonlyArray<ReadonlyArray<string>>,
    embed: Embed,
    x: number,
    y: number,
    width: number
): Lowered {
    const { nextId, palette } = embed;
    const columns = Math.max(1, headers.length);
    const widths = columnWidths(headers, rows, width - (TABLE_GAP * (columns - 1)));
    const offsets: Array<number> = [];
    let cursorX = x;
    for (let index = 0; index < columns; index += 1) {
        offsets.push(cursorX);
        cursorX += widths[index] + TABLE_GAP;
    }
    const shapes: Array<Node> = [];

    for (let index = 0; index < columns; index += 1) {
        const label = styledRun((headers[index] ?? "").toUpperCase(), { sizePx: 12, bold: true, color: palette.muted, font: palette.body });
        const head = txBodyOf(Anchor.Center, [paragraphOf(pProps(Align.Left, 12, 0), [label])], 0);
        shapes.push(textBox(nextId, offsets[index], y, widths[index], TABLE_HEADER_HEIGHT, head));
    }

    let cursorY = y + TABLE_HEADER_HEIGHT + TABLE_GAP;
    for (const row of rows) {
        let lines = 1;
        for (let index = 0; index < columns; index += 1) lines = Math.max(lines, lineCount(row[index] ?? "", widths[index] - 28, 15));
        const rowHeight = Math.max(TABLE_ROW_HEIGHT, (lines * 22) + 16);
        for (let index = 0; index < columns; index += 1) {
            shapes.push(glassPanel(nextId, offsets[index], cursorY, widths[index], rowHeight, palette, 12));
            const lead = index === 0;
            const style: RunStyle = { sizePx: 15, bold: lead, color: lead ? palette.text : palette.secondary, font: palette.body };
            const body = txBodyOf(Anchor.Center, [paragraphOf(pProps(Align.Left, 0, 0), inlineRuns(row[index] ?? "", style, palette))], 0);
            shapes.push(textBox(nextId, offsets[index] + 14, cursorY, widths[index] - 28, rowHeight, body));
        }
        cursorY += rowHeight + TABLE_GAP;
    }
    return lowered(shapes, cursorY - y - TABLE_GAP);
}

// The header row carries `<th>` but no `<td>`, so the empty-row filter drops it from the body rows.
function tableEl(element: ElementNode, embed: Embed, x: number, y: number, width: number): Lowered {
    const headers = findAll([element], HtmlTag.Th).map((cell) => textContent(cell));
    const rows: Array<Array<string>> = [];
    for (const rowEl of findAll([element], HtmlTag.Tr)) {
        const cells = childElements(rowEl).filter((cell) => cell.tag === HtmlTag.Td).map((cell) => textContent(cell));
        if (cells.length > 0) rows.push(cells);
    }
    return lowerTable(headers, rows, embed, x, y, width);
}

function imageWidthPx(image: ElementNode, columnWidth: number): number {
    const attr = attribute(image, "width");
    if (attr === null) return columnWidth;
    const px = pxOf(attr);
    if (px === null) return columnWidth;
    return Math.min(px, columnWidth);
}

function lowerImage(image: ElementNode, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette, nextRelId, assets } = embed;
    const alt = attribute(image, "alt") ?? "";
    const style = attribute(image, "style");
    // resolveImage only reads data URIs, so map the reference to its inlined asset first; an unmapped src stays as-is.
    const src = attribute(image, "src") ?? "";
    const resolved = resolveImage(assets.get(src) ?? src);
    if (!resolved) {
        // A bordered img still occupies its frame in the browser when the source fails, so draw that empty box.
        if (style?.includes("border")) {
            const boxHeight = Math.round(width * 0.52);
            return lowered([panel(nextId, x, y, width, boxHeight, palette.surface, 6, 100, palette.borderColor, palette.borderOpacity)], boxHeight);
        }
        const caption = paragraphOf(pProps(Align.Center, 0, 0), [styledRun(alt.length > 0 ? alt : "image", { sizePx: 15, color: palette.muted, font: palette.body })]);
        return lowered([textBox(nextId, x, y, width, 30, txBodyOf(Anchor.Top, [caption]))], 30);
    }
    const relationshipId = nextRelId();
    const media: SlideMedia = { relationshipId, extension: resolved.extension, contentType: resolved.contentType, data: resolved.bytes };
    // The browser renders the deck 1180 px wide, the export lays it out 1280 px wide. Author dimensions -- the image
    // size and the transform's translate -- are written for the browser, so they scale by this ratio to hold the
    // same fraction of the slide. The centre is unaffected (it is the content centre plus the scaled translate).
    const deckRatio = 1280 / 1180;
    const aspect = resolved.width / resolved.height;
    let fitWidth = imageWidthPx(image, width) * deckRatio;
    let fitHeight = fitWidth / aspect;
    if (fitHeight > IMAGE_MAX_HEIGHT) {
        fitHeight = IMAGE_MAX_HEIGHT;
        fitWidth = fitHeight * aspect;
    }
    const fitX = x + ((width - fitWidth) / 2);
    const transformValue = style === null ? null : styleValue(parseStyle(style), "transform");
    const transform = decompose(matrixOf(parseTransform(transformValue)));
    const drawWidth = fitWidth * transform.scaleX;
    const drawHeight = fitHeight * transform.scaleY;
    const centerX = fitX + (fitWidth / 2) + (transform.translateXPx * deckRatio);
    const centerY = y + (fitHeight / 2) + (transform.translateYPx * deckRatio);
    const shape = imageShape(nextId, relationshipId, morphName(src), centerX - (drawWidth / 2), centerY - (drawHeight / 2), drawWidth, drawHeight, transform.rotateDeg);
    return lowered([shape], fitHeight, { media: [media] });
}

// A shape-only SVG lowers to native shapes that PowerPoint morphs (fill, size, geometry) across slides; anything
// with a path, text or gradient falls back to a rasterised PNG that renders but cannot morph its content.
function lowerSvg(svg: ElementNode, embed: Embed, x: number, y: number, width: number): Lowered {
    const native = svgToShapes(svg, embed.nextId, x, y, width);
    if (native !== null) return lowered(native.shapes, native.height);
    return lowerSvgRaster(svg, embed, x, y, width);
}

// PowerPoint cannot embed SVG, so an inline SVG is placed as its pre-rasterised PNG (keyed by its markup). It
// morphs by its `data-morph` name like any shape; the inner-shape tween the browser runs is baked into the PNG.
function lowerSvgRaster(svg: ElementNode, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, nextRelId, svgPngs } = embed;
    const resolved = resolveImage(svgPngs.get(serialize(svg)) ?? "");
    if (!resolved) return lowered([], 0);
    const relationshipId = nextRelId();
    const media: SlideMedia = { relationshipId, extension: resolved.extension, contentType: resolved.contentType, data: resolved.bytes };
    const deckRatio = 1280 / 1180;
    const aspect = resolved.width / resolved.height;
    let fitWidth = imageWidthPx(svg, width) * deckRatio;
    let fitHeight = fitWidth / aspect;
    if (fitHeight > IMAGE_MAX_HEIGHT) {
        fitHeight = IMAGE_MAX_HEIGHT;
        fitWidth = fitHeight * aspect;
    }
    const morph = attribute(svg, "data-morph");
    const name = morph === null ? `svg-${relationshipId}` : morphName(morph);
    const shape = imageShape(nextId, relationshipId, name, x + ((width - fitWidth) / 2), y, fitWidth, fitHeight, 0);
    return lowered([shape], fitHeight, { media: [media] });
}

// Matched by substring, since these fragments appear within a longer class list.
const NOTE_CLASSES = ["border-l", "border-yellow", "italic"];

function classOf(element: ElementNode): string {
    return attribute(element, "class") ?? "";
}

function classTokens(element: ElementNode): Array<string> {
    const out: Array<string> = [];
    let current = "";
    for (const character of classOf(element)) {
        const space = character === " " || character === "\t" || character === "\n" || character === "\r" || character === "\f";
        if (space) {
            if (current !== "") out.push(current);
            current = "";
        } else current += character;
    }
    if (current !== "") out.push(current);
    return out;
}

function styleDigit(character: string): boolean {
    return character >= "0" && character <= "9";
}

function pxOf(value: string): number | null {
    let digits = "";
    let index = 0;
    while (index < value.length && (styleDigit(value.charAt(index)) || value.charAt(index) === ".")) {
        digits += value.charAt(index);
        index += 1;
    }
    if (digits === "") return null;
    const measure = Number(digits);
    const unit = value.slice(index);
    if (unit.startsWith("rem") || unit.startsWith("em")) return Math.round(measure * 16);
    return Math.round(measure);
}

function fontSizePx(element: ElementNode, fallback: number): number {
    const style = attribute(element, "style");
    if (style !== null) {
        const inline = styleValue(parseStyle(style), "font-size");
        if (inline !== null) {
            const px = pxOf(inline);
            if (px !== null) return px;
        }
    }
    const styles: Record<string, string | undefined> = resolveTailwind(classOf(element));
    const sized = styles.fontSize;
    if (sized !== undefined) {
        const px = pxOf(sized);
        if (px !== null) return px;
    }
    return fallback;
}

const COOL_FAMILIES = ["cyan", "teal", "sky", "blue", "emerald"];
const WARM_FAMILIES = ["orange", "red", "amber", "yellow", "rose", "pink"];

function colorClassOf(element: ElementNode, property: CssProperty): ColorClass | null {
    for (const token of classTokens(element)) {
        const colour = colorClass(token);
        if (colour !== null && colour.property === property) return colour;
    }
    return null;
}

function accentForFamily(family: string, palette: Palette, fallback: string): string {
    if (COOL_FAMILIES.includes(family)) return palette.accent1;
    if (WARM_FAMILIES.includes(family)) return palette.accent3;
    return fallback;
}

function colorOf(element: ElementNode, palette: Palette, fallback: string): string {
    const text = colorClassOf(element, CssProperty.Color);
    if (text === null) return fallback;
    if (text.family === "gray") return Number(text.shade) >= 500 ? palette.muted : palette.secondary;
    return accentForFamily(text.family, palette, fallback);
}

function borderAccent(element: ElementNode, palette: Palette, fallback: string): string {
    const border = colorClassOf(element, CssProperty.BorderColor);
    return border === null ? fallback : accentForFamily(border.family, palette, fallback);
}

function gridColumns(element: ElementNode): number {
    for (const token of classTokens(element)) {
        const count = tailwindGridColumns(token);
        if (count !== null) return count;
    }
    return 1;
}

function colSpan(cell: ElementNode, columns: number): number {
    for (const token of classTokens(cell)) {
        const span = columnSpan(token);
        if (span !== null) return Math.min(columns, span);
    }
    return 1;
}

function gapOf(element: ElementNode, fallback: number): number {
    const styles: Record<string, string | undefined> = resolveTailwind(classOf(element));
    const value = styles.gap ?? styles.columnGap ?? styles.rowGap;
    if (value === undefined) return fallback;
    return pxOf(value) ?? fallback;
}

const GRID_GAP = 16;
const GRID_CELL_PAD = 14;

function isBordered(cell: ElementNode): boolean {
    return classOf(cell).includes("border");
}

// A row must know its content height before placing it. The dry pass lowers into a fresh embed so it consumes
// none of the real pass's ids and discards the shapes it produced.
export function measuredHeight(embed: Embed, lower: (trial: Embed) => Lowered): number {
    return lower({ nextId: idFactory(), nextRelId: relFactory(), palette: embed.palette, assets: embed.assets, svgPngs: embed.svgPngs }).height;
}

function measureColumn(items: ReadonlyArray<Placed>, embed: Embed, width: number): number {
    return measuredHeight(embed, (trial) => lowerElements(items, trial, 0, 0, width));
}

type GridCell = { cell: ElementNode, span: number, offset: number };

function packGridRow(
    cells: ReadonlyArray<ElementNode>,
    start: number,
    columns: number
): { row: Array<GridCell>, next: number } {
    const row: Array<GridCell> = [];
    let consumed = 0;
    let index = start;
    while (index < cells.length) {
        const span = colSpan(cells[index], columns);
        if (consumed > 0 && consumed + span > columns) break;
        row.push({ cell: cells[index], span, offset: consumed });
        consumed += span;
        index += 1;
    }
    return { row, next: index };
}

function lowerGrid(cells: ReadonlyArray<ElementNode>, cols: number, embed: Embed, x: number, y: number, width: number, align: Align, gap: number): Lowered {
    const { nextId, palette } = embed;
    const columns = Math.max(1, cols);
    const unit = (width - (gap * (columns - 1))) / columns;
    const parts: Array<Lowered> = [];
    let rowY = y;
    let index = 0;
    while (index < cells.length) {
        const packed = packGridRow(cells, index, columns);
        index = packed.next;
        const row = packed.row.map((entry) => {
            const cellWidth = (unit * entry.span) + (gap * (entry.span - 1));
            const bordered = isBordered(entry.cell);
            const innerWidth = bordered ? cellWidth - (2 * GRID_CELL_PAD) : cellWidth;
            const accent = borderAccent(entry.cell, palette, palette.borderColor);
            const cellX = x + ((unit + gap) * entry.offset);
            return { blocks: blockElements(entry.cell.children, align), bordered, innerWidth, accent, cellWidth, cellX };
        });
        const inset = row.some((cell) => cell.bordered) ? 2 * GRID_CELL_PAD : 0;
        let content = 0;
        for (const cell of row) content = Math.max(content, measureColumn(cell.blocks, embed, cell.innerWidth));
        const rowHeight = content + inset;
        for (const cell of row) {
            if (cell.bordered) {
                const box = cell.accent !== palette.borderColor
                    ? panel(nextId, cell.cellX, rowY, cell.cellWidth, rowHeight, cell.accent, 12, 0, cell.accent, 100)
                    : panel(nextId, cell.cellX, rowY, cell.cellWidth, rowHeight, palette.surface, 12, 100, palette.borderColor, palette.borderOpacity);
                parts.push(lowered([box], 0));
            }
            const padding = cell.bordered ? GRID_CELL_PAD : 0;
            parts.push(lowerElements(cell.blocks, embed, cell.cellX + padding, rowY + padding, cell.innerWidth));
        }
        rowY += rowHeight + gap;
    }
    return combine(parts, Math.max(0, rowY - y - gap));
}

function lowerList(element: ElementNode, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette } = embed;
    const ordered = element.tag === HtmlTag.Ol;
    const items = childElements(element).filter((child) => child.tag === HtmlTag.Li);
    const innerWidth = width - 28;
    const props = ordered ? pProps(Align.Left, 28, 0) : pProps(Align.Left, 28, -28);
    const paragraphs = items.map((item) => paragraphOf(props, bulletRuns(item, palette, ordered)));
    let lines = 0;
    for (const item of items) lines += lineCount(textContent(item), innerWidth, 17);
    const height = lines * LINE;
    const text = textBox(nextId, x, y, width, height, txBodyOf(Anchor.Top, paragraphs));
    return lowered([text], height);
}

function bulletRuns(item: ElementNode, palette: Palette, ordered: boolean): Array<Node> {
    const runs: Array<Node> = [];
    // Tailwind's preflight strips list markers; the deck re-enables `disc` only for `ul`, leaving `ol` markerless.
    if (!ordered) runs.push(styledRun("\u2022   ", { sizePx: 16, color: palette.muted, font: palette.body }));
    for (const run of inlineRunsFromNodes(item.children, bodyStyle(palette), palette)) runs.push(run);
    return runs;
}

function headingEl(element: ElementNode, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    const { nextId, palette } = embed;
    const { tag } = element;
    const content = textContent(element);
    // The slide's own `#` title is extracted earlier, so a body `<h1>` is an authored hero line that always
    // centres in the accent colour rather than following the slide's alignment.
    if (tag === HtmlTag.H1) {
        const sizePx = fontSizePx(element, 44);
        const height = Math.round(sizePx * 1.2);
        return lowered([runBox(nextId, x, y, width, height, Anchor.Center, Align.Center, content, { sizePx, bold: true, color: palette.accent1, font: palette.display }, undefined, morphName(content))], height);
    }
    const sizePx = fontSizePx(element, tag === HtmlTag.H2 ? 28 : 22);
    const color = tag === HtmlTag.H3 ? palette.accent1 : palette.text;
    const height = Math.round(sizePx * 1.5);
    return lowered([runBox(nextId, x, y, width, height, Anchor.Bottom, align, content, { sizePx, bold: true, color, font: palette.body }, undefined, morphName(content))], height);
}

function paragraphEl(element: ElementNode, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    const image = findFirst(element, HtmlTag.Img);
    if (image !== null) return lowerImage(image, embed, x, y, width);
    const svg = findFirst(element, HtmlTag.Svg);
    if (svg !== null) return lowerSvg(svg, embed, x, y, width);
    const content = textContent(element);
    if (content.trim().length === 0) return lowered([], 0);
    const { nextId, palette } = embed;
    const sizePx = fontSizePx(element, 17);
    const style: RunStyle = { sizePx, color: colorOf(element, palette, palette.secondary), font: palette.body };
    const segments = inlineSegments(element.children, style, palette);
    const paragraphs = segments.map((runs) => paragraphOf(pProps(align, 0, 0), runs));
    const lines = Math.max(segments.length, lineCount(content, width, sizePx));
    const height = lines * Math.round(sizePx * 1.55);
    return lowered([textBox(nextId, x, y, width, height, txBodyOf(Anchor.Top, paragraphs), morphName(content))], height);
}

function trimTrailingNewlines(content: string): string {
    let end = content.length;
    while (end > 0 && content.charAt(end - 1) === "\n") end -= 1;
    return content.slice(0, end);
}

function lowerCode(content: string, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette } = embed;
    const lines = trimTrailingNewlines(content).split("\n");
    const paragraphs = lines.map((line) => paragraphOf(pProps(Align.Left, 0, 0), [styledRun(line === "" ? " " : line, { sizePx: 15, color: palette.text, font: palette.mono })]));
    const height = (lines.length * 24) + (2 * PANEL_PAD);
    const surface = glassPanel(nextId, x, y, width, height, palette, 14);
    const text = textBox(nextId, x + PANEL_PAD, y + PANEL_PAD, width - (2 * PANEL_PAD), height - (2 * PANEL_PAD), txBodyOf(Anchor.Center, paragraphs));
    return lowered([surface, text], height);
}

const HEADING_TAGS = new Set<string>([HtmlTag.H1, HtmlTag.H2, HtmlTag.H3, HtmlTag.H4, HtmlTag.H5, HtmlTag.H6]);

function isGrid(element: ElementNode): boolean {
    for (const token of classTokens(element)) if (tailwindGridColumns(token) !== null) return true;
    return false;
}

function isNote(element: ElementNode): boolean {
    const classes = classOf(element);
    for (const marker of NOTE_CLASSES) if (classes.includes(marker)) return true;
    return false;
}

// A div is flattened only when it carries one of these; a text-only div falls through to a paragraph so its text
// is not flattened away to nothing.
const BLOCK_LEVEL_TAGS = new Set<string>([
    HtmlTag.Div,
    HtmlTag.P,
    HtmlTag.Ul,
    HtmlTag.Ol,
    HtmlTag.Pre,
    HtmlTag.Blockquote,
    HtmlTag.Table,
    HtmlTag.Figure,
    HtmlTag.Section,
    HtmlTag.Header,
    HtmlTag.Footer,
    HtmlTag.Article,
    HtmlTag.Aside,
    HtmlTag.Main,
    HtmlTag.Details,
    HtmlTag.H1,
    HtmlTag.H2,
    HtmlTag.H3,
    HtmlTag.H4,
    HtmlTag.H5,
    HtmlTag.H6
]);

function hasBlockChild(element: ElementNode): boolean {
    for (const child of childElements(element)) if (BLOCK_LEVEL_TAGS.has(child.tag)) return true;
    return false;
}

function isWrapper(element: ElementNode): boolean {
    if (element.tag !== HtmlTag.Div) return false;
    if (isGrid(element)) return false;
    if (isNote(element)) return false;
    return hasBlockChild(element);
}

// A wrapper carrying one of these centres its flattened children, since the alignment would otherwise be lost when
// the wrapper is spliced open.
const CENTERING_CLASSES = ["text-center", "items-center", "justify-center"];
function centersChildren(element: ElementNode): boolean {
    const classes = classOf(element);
    for (const marker of CENTERING_CLASSES) if (classes.includes(marker)) return true;
    return false;
}

type Placed = { element: ElementNode, align: Align };

// Children are pushed reversed so they pop in document order, keeping the wrapper-splicing walk flat (no recursion).
function blockElements(roots: Content, align: Align): Array<Placed> {
    const out: Array<Placed> = [];
    const stack: Array<{ node: DomNode, align: Align }> = [];
    for (let index = roots.length - 1; index >= 0; index -= 1) stack.push({ node: roots[index], align });
    let guard = 0;
    while (stack.length > 0 && guard < 4096) {
        guard += 1;
        const top = stack.pop();
        if (top === undefined) break;
        if (!(NodeField.Tag in top.node)) continue;
        const element = top.node;
        if (isWrapper(element)) {
            const childAlign = centersChildren(element) ? Align.Center : top.align;
            for (let index = element.children.length - 1; index >= 0; index -= 1) stack.push({ node: element.children[index], align: childAlign });
        } else out.push({ element, align: top.align });
    }
    return out;
}

function gridAlign(element: ElementNode, align: Align): Align {
    return classOf(element).includes("text-center") ? Align.Center : align;
}

function codeLineEl(element: ElementNode, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    const { nextId, palette } = embed;
    const sizePx = fontSizePx(element, 13);
    const style: RunStyle = { sizePx, color: palette.accent1, font: palette.mono, highlight: palette.chipColor };
    const height = Math.round(sizePx * 1.7);
    return lowered([runBox(nextId, x, y, width, height, Anchor.Top, align, textContent(element), style)], height);
}

function lowerElement(element: ElementNode, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    const { tag } = element;
    if (HEADING_TAGS.has(tag)) return headingEl(element, embed, x, y, width, align);
    if (tag === HtmlTag.P) return paragraphEl(element, embed, x, y, width, align);
    if (tag === HtmlTag.Ul || tag === HtmlTag.Ol) return lowerList(element, embed, x, y, width);
    if (tag === HtmlTag.Blockquote) return blockquoteEl(element, embed, x, y, width, align);
    if (tag === HtmlTag.Pre) return lowerCode(textContent(element), embed, x, y, width);
    if (tag === HtmlTag.Code) return codeLineEl(element, embed, x, y, width, align);
    if (tag === HtmlTag.Table) return tableEl(element, embed, x, y, width);
    if (tag === HtmlTag.Img) return lowerImage(element, embed, x, y, width);
    if (tag === HtmlTag.Svg) return lowerSvg(element, embed, x, y, width);
    if (tag === HtmlTag.Div && isGrid(element)) return lowerGrid(childElements(element), gridColumns(element), embed, x, y, width, gridAlign(element, align), gapOf(element, GRID_GAP));
    if (tag === HtmlTag.Div && isNote(element)) return noteEl(element, embed, x, y, width);
    return paragraphEl(element, embed, x, y, width, align);
}

function lowerElements(items: ReadonlyArray<Placed>, embed: Embed, x: number, y: number, width: number): Lowered {
    return stackDown(items, y, BLOCK_GAP, true, (item, cursorY) => lowerElement(item.element, embed, x, cursorY, width, item.align));
}

function lowerMarkup(html: string, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    const inner = lowerElements(blockElements(parse(html), align), embed, x, y, width);
    return combine([inner], Math.max(LINE, inner.height));
}

// Capped at 24 steps so a large target steps in ~24 jumps, not a frame per integer; deduped for small targets.
function countFrames(target: number): Array<number> {
    const steps = Math.min(target, 24);
    // A target of 0 has no roll to animate, and dividing by `steps` below would be 0/0 -> NaN.
    if (steps < 1) return [target];
    const values: Array<number> = [];
    for (let index = 0; index <= steps; index += 1) {
        const value = Math.round((target * index) / steps);
        if (values.length === 0 || values[values.length - 1] !== value) values.push(value);
    }
    return values;
}

function lowerMetrics(rows: ReadonlyArray<MetricRow>, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette } = embed;
    const cols = metricCols(rows.length);
    const cellWidth = (width - (GAP * (cols - 1))) / cols;
    const innerWidth = cellWidth - (2 * PANEL_PAD);
    const subOffset = PANEL_PAD + 68;
    // Every cell shares the tallest sub-caption's height so a two-line caption neither spills nor breaks row alignment.
    let subHeight = SUB_LINE;
    for (const row of rows) subHeight = Math.max(subHeight, lineCount(row.sub, innerWidth, 15) * SUB_LINE);
    const height = subOffset + subHeight + PANEL_PAD;
    const shapes: Array<Node> = [];
    const anim: Array<AnimatedShapeRef> = [];
    rows.forEach((row, index) => {
        const cellX = x + ((cellWidth + GAP) * (index % cols));
        const cellY = y + (Math.floor(index / cols) * (height + GAP));
        const innerX = cellX + PANEL_PAD;
        const valueY = cellY + PANEL_PAD + 20;
        const value: RunStyle = { sizePx: 34, bold: true, color: palette.accent1, font: palette.display };
        shapes.push(glassPanel(nextId, cellX, cellY, cellWidth, height, palette, 18));
        shapes.push(runBox(nextId, innerX, cellY + PANEL_PAD, innerWidth, 18, Anchor.Top, Align.Left, row.label.toUpperCase(), { sizePx: 12, bold: true, color: palette.muted, font: palette.body }));
        if ((/^\d+$/).test(row.value)) {
            const frames: Array<Node> = [];
            for (const step of countFrames(Number(row.value))) {
                const frame = runBox(nextId, innerX, valueY, innerWidth, 48, Anchor.Top, Align.Left, String(step), value);
                shapes.push(frame);
                frames.push(frame);
            }
            anim.push({ shapes: frames, kind: Motion.Counter });
        } else
            shapes.push(runBox(nextId, innerX, valueY, innerWidth, 48, Anchor.Top, Align.Left, row.value, value));

        shapes.push(runBox(nextId, innerX, cellY + subOffset, innerWidth, subHeight, Anchor.Top, Align.Left, row.sub, { sizePx: 15, color: palette.secondary, font: palette.body }));
    });
    const rowsUsed = Math.ceil(rows.length / cols);
    return lowered(shapes, (rowsUsed * height) + ((rowsUsed - 1) * GAP), { anim });
}

function cardTitleHeight(title: string, innerWidth: number): number {
    const perLine = Math.max(1, Math.floor(innerWidth / (CARD_TITLE_SIZE * CARD_TITLE_CHAR_WIDTH)));
    const lines = Math.max(1, Math.ceil(title.length / perLine));
    return (lines * CARD_TITLE_LINE) + 8;
}

function lowerCards(cards: ReadonlyArray<Card>, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette } = embed;
    const cols = gridCols(cards.length);
    const cellWidth = (width - (GAP * (cols - 1))) / cols;
    const innerWidth = cellWidth - (2 * PANEL_PAD);
    const built = cards.map((card) => {
        const blocks = blockElements(parse(renderMarkdown(card.body)), Align.Left);
        const titleHeight = cardTitleHeight(card.title, innerWidth);
        return { card, blocks, titleHeight, contentHeight: titleHeight + measureColumn(blocks, embed, innerWidth) };
    });
    const titleStyle: RunStyle = { sizePx: CARD_TITLE_SIZE, bold: true, color: palette.accent1, font: palette.body };
    const parts: Array<Lowered> = [];
    let rowY = y;
    for (let start = 0; start < built.length; start += cols) {
        const row = built.slice(start, start + cols);
        let rowContent = 0;
        for (const cell of row) rowContent = Math.max(rowContent, cell.contentHeight);
        const rowHeight = rowContent + (2 * PANEL_PAD);
        for (let index = 0; index < row.length; index += 1) {
            const cell = row[index];
            const cellX = x + ((cellWidth + GAP) * index);
            parts.push(lowered([
                glassPanel(nextId, cellX, rowY, cellWidth, rowHeight, palette, PANEL_RADIUS),
                runBox(nextId, cellX + PANEL_PAD, rowY + PANEL_PAD, innerWidth, cell.titleHeight, Anchor.Top, Align.Left, cell.card.title, titleStyle, undefined, morphName(cell.card.title))
            ], 0));
            parts.push(lowerElements(cell.blocks, embed, cellX + PANEL_PAD, rowY + PANEL_PAD + cell.titleHeight, innerWidth));
        }
        rowY += rowHeight + GAP;
    }
    return combine(parts, Math.max(0, rowY - y - GAP));
}

function lowerBars(rows: ReadonlyArray<BarRow>, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette } = embed;
    const rowHeight = 48;
    const height = (rows.length * rowHeight) + (2 * PANEL_PAD);
    const shapes: Array<Node> = [glassPanel(nextId, x, y, width, height, palette, PANEL_RADIUS)];
    const anim: Array<AnimatedShapeRef> = [];
    const innerX = x + PANEL_PAD;
    const innerWidth = width - (2 * PANEL_PAD);
    rows.forEach((row, index) => {
        const rowY = y + PANEL_PAD + (index * rowHeight);
        shapes.push(runBox(nextId, innerX, rowY, innerWidth, 22, Anchor.Top, Align.Left, row.label, { sizePx: 15, bold: true, color: palette.text, font: palette.body }));
        shapes.push(runBox(nextId, innerX, rowY, innerWidth, 22, Anchor.Top, Align.Right, row.tag, { sizePx: 15, color: palette.muted, font: palette.body }));
        shapes.push(panel(nextId, innerX, rowY + 24, innerWidth, 14, palette.track, 7));
        const fillWidth = Math.max(7, Math.round(innerWidth * barFraction(row.percent)));
        const fill = panel(nextId, innerX, rowY + 24, fillWidth, 14, palette.accent1, 7);
        shapes.push(fill);
        anim.push({ shapes: [fill], kind: Motion.Wipe });
    });
    return lowered(shapes, height, { anim });
}

function lowerBlock(block: Block, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    switch (block.kind) {
        case BlockKind.Prose:
            return lowerMarkup(renderMarkdown(block.markdown), embed, x, y, width, align);
        case BlockKind.Code:
            return lowerCode(block.content, embed, x, y, width);
        case BlockKind.Metrics:
            return lowerMetrics(block.rows, embed, x, y, width);
        case BlockKind.Cards:
            return lowerCards(block.cards, embed, x, y, width);
        case BlockKind.Bars:
            return lowerBars(block.rows, embed, x, y, width);
        case BlockKind.Chart:
            return lowerChart(block.chart, embed, x, y, width);
        case BlockKind.Columns:
            return lowerColumns(block.columns, embed, x, y, width, align);
        case BlockKind.Html:
            return lowerMarkup(renderMarkdown(block.markup), embed, x, y, width, align);
    }
}

function lowerColumns(columns: ReadonlyArray<ReadonlyArray<Block>>, embed: Embed, x: number, y: number, width: number, align: Align): Lowered {
    const count = Math.max(columns.length, 1);
    const columnWidth = (width - (GAP * (count - 1))) / count;
    const loweredColumns = columns.map((column, index) => lowerBlocks(column, embed, x + (index * (columnWidth + GAP)), y, columnWidth, align));
    let heightMax = 0;
    for (const column of loweredColumns) heightMax = Math.max(heightMax, column.height);
    return combine(loweredColumns, heightMax);
}

export function lowerBlocks(blocks: ReadonlyArray<Block>, embed: Embed, x: number, y: number, width: number, align: Align = Align.Left): Lowered {
    return stackDown(blocks, y, GAP, false, (block, cursorY) => lowerBlock(block, embed, x, cursorY, width, align));
}
