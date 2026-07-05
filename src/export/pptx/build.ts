import {
    alpha, bodyPr, cNvPr, closePath, custGeom, element, ext, gridCol, grpSpPr, highlight, latin, lnTo, moveTo, noFill,
    nvGrpSpPr, nvPicPr, nvSpPr, off, path2D, pathLst, pic, picBlipFill, prstGeom, pt, roundRect, rPr, run, solidFill,
    sp, spcBef, spcPts, spPr, ST_TextAlignType, ST_TextAnchoringType, ST_TextWrappingType, tableFrame, tbl, tblGrid,
    tc, tr, txBodyA, xfrm
} from "@dropdeck/pptx";
import { emu, fontSize, SLIDE_HEIGHT_EMU, SLIDE_WIDTH_EMU } from "#/export/pptx/units";
import type {
    BodyPropertyAttr, CT_EffectList, CT_GradientFillProperties, CT_GraphicalObjectFrame, CT_GroupShape,
    CT_LineProperties, CT_Path2DCommand, CT_Picture, CT_Shape, CT_SolidColorFillProperties, CT_SRgbColor,
    CT_TableCellProperties,
    CT_TextBody, CT_TextParagraph, CT_TextParagraphProperties, Element, Empty, Node, RunPropertyAttr
} from "@dropdeck/pptx";

// Colour and container elements go through the package's generic `element()`, not its hand-authoring helpers:
// deck colours are runtime strings that the validated `srgbClr` refuses, and dynamic child lists can't reach
// the variadic builders without spread.

export enum Align {
    Left = "l",
    Center = "ctr",
    Right = "r"
}

export enum Anchor {
    Top = "t",
    Center = "ctr",
    Bottom = "b"
}

const ALIGN: Record<Align, ST_TextAlignType> = {
    [Align.Left]: ST_TextAlignType.Left,
    [Align.Center]: ST_TextAlignType.Center,
    [Align.Right]: ST_TextAlignType.Right
};
const ANCHOR: Record<Anchor, ST_TextAnchoringType> = {
    [Anchor.Top]: ST_TextAnchoringType.Top,
    [Anchor.Center]: ST_TextAnchoringType.Center,
    [Anchor.Bottom]: ST_TextAnchoringType.Bottom
};

// Matches `.slide img { border-radius: 12px }` so the deck and its export round image corners the same way.
const IMAGE_RADIUS_PX = 12;

export function idFactory(): () => number {
    let next = 1; // 1 is the spTree's own group shape; real shapes start at 2.
    return () => {
        next += 1;
        return next;
    };
}

// rId1 is the slide layout, so media starts at rId2.
export function relFactory(): () => string {
    let next = 1;
    return () => {
        next += 1;
        return `rId${next}`;
    };
}

// Opacity is a percentage (0..100); OOXML alpha is in thousandths of a percent, so it scales by 1000.
function srgb(hex: string, opacityPct?: number): CT_SRgbColor {
    if (opacityPct === undefined) return element("a:srgbClr", [["val", hex]], []);
    return element("a:srgbClr", [["val", hex]], [alpha(Math.round(opacityPct * 1000))]);
}

export function fill(hex: string, opacityPct?: number): CT_SolidColorFillProperties {
    return solidFill(srgb(hex, opacityPct));
}

// `name` is per-shape so a background scatter pairs one-to-one across slides: identically named shapes let
// PowerPoint's morph glide each dot to an arbitrary other, swirling a background that should hold still.
export function ellipse(
    nextId: () => number,
    name: string,
    cxPx: number,
    cyPx: number,
    radiusPx: number,
    color: string,
    opacityPct: number
): CT_Shape {
    const diameter = radiusPx * 2;
    const geometry = spPr(xfrm(off(emu(cxPx - radiusPx), emu(cyPx - radiusPx)), ext(emu(diameter), emu(diameter))), prstGeom("ellipse"), fill(color, opacityPct));
    return sp(nvSpPr(cNvPr(nextId(), name)), geometry, emptyBody());
}

// A radial fade to transparent gives the soft glow of the deck's blurred mesh blobs; a solid ellipse would be a
// hard-edged disc.
function glowFill(color: string, opacityPct: number): CT_GradientFillProperties {
    const inner = element("a:gs", [["pos", 0]], [srgb(color, opacityPct)]);
    const outer = element("a:gs", [["pos", 100000]], [srgb(color, 0)]);
    const stops = element("a:gsLst", [], [inner, outer]);
    const path = element("a:path", [["path", "circle"]], [element("a:fillToRect", [["l", 50000], ["t", 50000], ["r", 50000], ["b", 50000]], [])]);
    return element("a:gradFill", [], [stops, path]);
}

function blur(radiusPx: number): Element<"a:effectLst", Empty, readonly [Element<"a:blur", readonly [readonly ["rad", number]], Empty>]> {
    return element("a:effectLst", [], [element("a:blur", [["rad", emu(radiusPx)]], [])]);
}

export function blob(
    nextId: () => number,
    name: string,
    cxPx: number,
    cyPx: number,
    radiusPx: number,
    color: string,
    opacityPct: number
): CT_Shape {
    const diameter = radiusPx * 2;
    const geometry = spPr(xfrm(off(emu(cxPx - radiusPx), emu(cyPx - radiusPx)), ext(emu(diameter), emu(diameter))), prstGeom("ellipse"), glowFill(color, opacityPct), blur(48));
    return sp(nvSpPr(cNvPr(nextId(), name)), geometry, emptyBody());
}

export type RunStyle = {
    sizePx: number,
    color: string,
    bold?: boolean,
    italic?: boolean,
    font: string,
    highlight?: string
};

export function styledRun(text: string, style: RunStyle): ReturnType<typeof run> {
    const attrs: Array<RunPropertyAttr> = [["sz", fontSize(style.sizePx)]];
    if (style.bold === true) attrs.push(["b", true]);
    if (style.italic === true) attrs.push(["i", true]);
    if (style.highlight === undefined) return run(text, rPr(attrs, fill(style.color), latin(style.font)));
    return run(text, rPr(attrs, fill(style.color), highlight(srgb(style.highlight)), latin(style.font)));
}

export function paragraphOf(
    properties: CT_TextParagraphProperties | null,
    runs: ReadonlyArray<Node>
): CT_TextParagraph {
    const acc: Array<Node> = [];
    if (properties) acc.push(properties);
    for (const item of runs) acc.push(item);
    const children: ReadonlyArray<Node> = acc;
    return element("a:p", [], children) as CT_TextParagraph;
}

export function pProps(
    align: Align,
    marginLeftPx: number,
    indentPx: number,
    spaceBeforePx = 0
): CT_TextParagraphProperties {
    const attrs = [["algn", ALIGN[align]], ["marL", emu(marginLeftPx)], ["indent", emu(indentPx)]] as const;
    if (spaceBeforePx <= 0) return element("a:pPr", attrs, []);
    return element("a:pPr", attrs, [spcBef(spcPts(fontSize(spaceBeforePx)))]);
}

// `insetPx` overrides PowerPoint's default text-box padding on all four edges; pass 0 when a shape must hug its
// text exactly, e.g. an accent bar tracking it.
export function txBodyOf(
    anchor: Anchor,
    paragraphs: ReadonlyArray<CT_TextParagraph>,
    insetPx?: number
): CT_TextBody {
    const attrs: Array<BodyPropertyAttr> = [["anchor", ANCHOR[anchor]], ["wrap", ST_TextWrappingType.Square]];
    if (insetPx !== undefined) {
        const inset = emu(insetPx);
        attrs.push(["lIns", inset], ["tIns", inset], ["rIns", inset], ["bIns", inset]);
    }
    const properties = bodyPr(attrs);
    const acc: Array<Node> = [properties];
    for (const paragraph of paragraphs) acc.push(paragraph);
    const children: ReadonlyArray<Node> = acc;
    return element("p:txBody", [], children) as CT_TextBody;
}

function emptyBody(): CT_TextBody {
    return txBodyOf(Anchor.Top, [paragraphOf(null, [])]);
}

export function spTreeOf(members: ReadonlyArray<Node>): CT_GroupShape {
    const acc: Array<Node> = [nvGrpSpPr(cNvPr(1, "")), grpSpPr()];
    for (const member of members) acc.push(member);
    const children: ReadonlyArray<Node> = acc;
    return element("p:spTree", [], children) as CT_GroupShape;
}

export function backgroundRect(nextId: () => number, color: string): CT_Shape {
    const geometry = spPr(xfrm(off(0, 0), ext(SLIDE_WIDTH_EMU, SLIDE_HEIGHT_EMU)), prstGeom("rect"), fill(color));
    return sp(nvSpPr(cNvPr(nextId(), "bg")), geometry, emptyBody());
}

function outline(color: string, opacityPct: number): CT_LineProperties {
    return element("a:ln", [["w", emu(1)]], [fill(color, opacityPct)]);
}

// Direction 5400000 is straight down.
function shadow(): CT_EffectList {
    const cast = element("a:outerShdw", [["blurRad", emu(20)], ["dist", emu(8)], ["dir", 5400000], ["rotWithShape", false]], [srgb("000000", 30)]);
    return element("a:effectLst", [], [cast]);
}

export function panel(
    nextId: () => number,
    xPx: number,
    yPx: number,
    widthPx: number,
    heightPx: number,
    color: string,
    radiusPx: number,
    opacityPct?: number,
    borderColor?: string,
    borderOpacity?: number
): CT_Shape {
    const shorter = Math.min(widthPx, heightPx);
    const adjust = Math.min(Math.round((radiusPx / shorter) * 100000), 50000);
    const transform = xfrm(off(emu(xPx), emu(yPx)), ext(emu(widthPx), emu(heightPx)));
    const geometry = borderColor === undefined
        ? spPr(transform, roundRect(adjust), fill(color, opacityPct))
        : spPr(transform, roundRect(adjust), fill(color, opacityPct), outline(borderColor, borderOpacity ?? 100), shadow());
    return sp(nvSpPr(cNvPr(nextId(), "panel")), geometry, emptyBody());
}

export function rule(
    nextId: () => number,
    xPx: number,
    yPx: number,
    widthPx: number,
    color: string,
    name: string = "rule"
): CT_Shape {
    const geometry = spPr(xfrm(off(emu(xPx), emu(yPx)), ext(emu(widthPx), emu(4))), roundRect(50000), fill(color));
    return sp(nvSpPr(cNvPr(nextId(), name)), geometry, emptyBody());
}

// SVG strokes vary in width, unlike the fixed 1px `outline`.
function svgStroke(color: string, widthPx: number): CT_LineProperties {
    return element("a:ln", [["w", emu(Math.max(widthPx, 1))]], [fill(color)]);
}

// A native preset shape (ellipse, rect, ..) filling its box, named so PowerPoint's morph tweens it across slides.
export function presetShape(
    nextId: () => number,
    name: string,
    preset: "ellipse" | "rect" | "roundRect",
    xPx: number,
    yPx: number,
    widthPx: number,
    heightPx: number,
    fillColor: string | null,
    strokeColor: string | null,
    strokeWidthPx: number
): CT_Shape {
    const transform = xfrm(off(emu(xPx), emu(yPx)), ext(emu(Math.max(widthPx, 1)), emu(Math.max(heightPx, 1))));
    const paint = fillColor === null ? noFill() : fill(fillColor);
    const geometry = strokeColor === null
        ? spPr(transform, prstGeom(preset), paint)
        : spPr(transform, prstGeom(preset), paint, svgStroke(strokeColor, strokeWidthPx));
    return sp(nvSpPr(cNvPr(nextId(), name)), geometry, emptyBody());
}

// A custom-geometry shape drawn through slide-px points; its box is their bounding rect so the path fills it. Used
// for lines, polylines and polygons, which have no matching preset.
// `box` is the whole SVG frame, shared by every shape lowered from it rather than tight around these points, so
// PowerPoint's morph interpolates only the path vertices; a per-shape box would move and resize and tangle the tween.
export function customShape(
    nextId: () => number,
    name: string,
    points: ReadonlyArray<readonly [number, number]>,
    box: { x: number, y: number, width: number, height: number },
    closed: boolean,
    fillColor: string | null,
    strokeColor: string | null,
    strokeWidthPx: number
): CT_Shape {
    const width = Math.max(box.width, 1);
    const height = Math.max(box.height, 1);
    const commands: Array<CT_Path2DCommand> = [];
    points.forEach(([px, py], index) => {
        const point = pt(emu(px - box.x), emu(py - box.y));
        commands.push(index === 0 ? moveTo(point) : lnTo(point));
    });
    if (closed) commands.push(closePath());
    const geom = custGeom(pathLst(path2D(emu(width), emu(height), commands)));
    const transform = xfrm(off(emu(box.x), emu(box.y)), ext(emu(width), emu(height)));
    const paint = fillColor === null ? noFill() : fill(fillColor);
    const geometry = strokeColor === null
        ? spPr(transform, geom, paint)
        : spPr(transform, geom, paint, svgStroke(strokeColor, strokeWidthPx));
    return sp(nvSpPr(cNvPr(nextId(), name)), geometry, emptyBody());
}

// `name` is the shape's identity for PowerPoint's morph transition: two slides whose title boxes share a name
// tween into each other, so callers pass a stable name for anything that should morph.
export function textBox(
    nextId: () => number,
    xPx: number,
    yPx: number,
    widthPx: number,
    heightPx: number,
    body: CT_TextBody,
    name: string = "tx"
): CT_Shape {
    const geometry = spPr(xfrm(off(emu(xPx), emu(yPx)), ext(emu(widthPx), emu(heightPx))));
    return sp(nvSpPr(cNvPr(nextId(), name)), geometry, body);
}

// roundRect's adjust is a fraction (0..50000) of the shorter side, so the fixed 12px is scaled to that side.
function imageRadiusAdjust(widthPx: number, heightPx: number): number {
    return Math.min(50000, Math.round((IMAGE_RADIUS_PX / Math.min(widthPx, heightPx)) * 100000));
}

export function imageShape(
    nextId: () => number,
    embed: string,
    name: string,
    xPx: number,
    yPx: number,
    widthPx: number,
    heightPx: number,
    rotationDeg: number = 0
): CT_Picture {
    const transform = xfrm(off(emu(xPx), emu(yPx)), ext(emu(widthPx), emu(heightPx)), Math.round(rotationDeg * 60000));
    const geometry = spPr(transform, roundRect(imageRadiusAdjust(widthPx, heightPx)));
    return pic(nvPicPr(cNvPr(nextId(), name)), picBlipFill(embed), geometry);
}

// A zero-width cell border, set explicitly because cell-level borders win over the default table style.
function blankBorder<const T extends "a:lnR" | "a:lnT" | "a:lnB">(tag: T): Element<T, readonly [readonly ["w", 0]], Empty> {
    return element(tag, [["w", 0]], []);
}

// A `border-l` note as a single-cell table: the accent is the cell's left border so it tracks text height exactly,
// which a separate bar shape would have to guess. The blank other borders and transparent fill mean no table style
// is needed; zeroed top/bottom margins make the row equal the text, and `heightPx` only reserves layout extent.
export function leftBarFrame(
    nextId: () => number,
    xPx: number,
    yPx: number,
    widthPx: number,
    heightPx: number,
    accent: string,
    runs: ReadonlyArray<Node>
): CT_GraphicalObjectFrame {
    const body = txBodyA(bodyPr([["anchor", ANCHOR[Anchor.Center]]]), paragraphOf(pProps(Align.Left, 0, 0), runs));
    const leftBorder = element("a:lnL", [["w", emu(4)]], [fill(accent)]);
    const props: CT_TableCellProperties = element(
        "a:tcPr",
        [["marL", emu(18)], ["marT", 0], ["marB", 0]],
        [leftBorder, blankBorder("a:lnR"), blankBorder("a:lnT"), blankBorder("a:lnB"), fill("000000", 0)]
    );
    const table = tbl(tblGrid(gridCol(emu(widthPx))), tr(emu(6), tc(body, props)));
    return tableFrame(nextId(), "note", emu(xPx), emu(yPx), emu(widthPx), emu(heightPx), table);
}
