import { attribute, childElements } from "@dropdeck/html";
import { memberGuard } from "@dropdeck/common";
import { numberList } from "@dropdeck/xml/svg";
import { expandHex } from "#/hex";
import { customShape, presetShape } from "#/export/pptx/build";
import { morphName } from "#/animations/spec";
import type { ElementNode } from "@dropdeck/html";
import type { CT_Shape } from "@dropdeck/pptx";

const DECK_RATIO = 1280 / 1180;
const isPresetTag = memberGuard(["circle", "ellipse", "rect"]);
const isPathTag = memberGuard(["line", "polyline", "polygon"]);

type Frame = { originX: number, originY: number, scale: number, width: number, height: number };

function attrNumber(element: ElementNode, name: string, fallback: number): number {
    const value = parseFloat(attribute(element, name) ?? "");
    return Number.isNaN(value) ? fallback : value;
}

// `#5cd0b3` and `#5cb` both become the 6-hex `srgbClr` wants; a non-hex colour (a name, `none`) has no fill.
function hexColor(value: string | null): string | null {
    if (value?.startsWith("#") !== true) return null;
    return expandHex(value);
}

function descendants(root: ElementNode): Array<ElementNode> {
    const out: Array<ElementNode> = [];
    for (const child of childElements(root)) {
        if (child.tag === "g") for (const nested of descendants(child)) out.push(nested);
        else out.push(child);
    }
    return out;
}

// Every drawn element must be a shape this lowers; a `path`, `text` or gradient means the SVG rasterises instead.
function convertible(svg: ElementNode): boolean {
    for (const element of descendants(svg)) if (!isPresetTag(element.tag) && !isPathTag(element.tag)) return false;
    return true;
}

function frameOf(svg: ElementNode, x: number, y: number, width: number): Frame {
    const box = numberList(attribute(svg, "viewBox") ?? "");
    const viewWidth = box.length === 4 && box[2] > 0 ? box[2] : attrNumber(svg, "width", 300);
    const viewHeight = box.length === 4 && box[3] > 0 ? box[3] : attrNumber(svg, "height", 300);
    const placedWidth = Math.min(attrNumber(svg, "width", viewWidth), width) * DECK_RATIO;
    const scale = placedWidth / viewWidth;
    return { originX: x + ((width - placedWidth) / 2), originY: y, scale, width: placedWidth, height: viewHeight * scale };
}

function presetFor(tag: string, element: ElementNode): "ellipse" | "rect" | "roundRect" {
    if (tag === "rect") return attrNumber(element, "rx", 0) > 0 ? "roundRect" : "rect";
    return "ellipse";
}

type Box = { x: number, y: number, width: number, height: number };

function presetBox(tag: string, element: ElementNode, frame: Frame): Box {
    function mapX(value: number): number {
        return frame.originX + (value * frame.scale);
    }
    function mapY(value: number): number {
        return frame.originY + (value * frame.scale);
    }
    if (tag === "rect") {
        return {
            x: mapX(attrNumber(element, "x", 0)),
            y: mapY(attrNumber(element, "y", 0)),
            width: attrNumber(element, "width", 0) * frame.scale,
            height: attrNumber(element, "height", 0) * frame.scale
        };
    }
    const rx = attrNumber(element, tag === "circle" ? "r" : "rx", 0);
    const ry = attrNumber(element, tag === "circle" ? "r" : "ry", rx);
    return {
        x: mapX(attrNumber(element, "cx", 0) - rx),
        y: mapY(attrNumber(element, "cy", 0) - ry),
        width: rx * 2 * frame.scale,
        height: ry * 2 * frame.scale
    };
}

function pointsFor(tag: string, element: ElementNode, frame: Frame): Array<readonly [number, number]> {
    const coordinates = tag === "line"
        ? [attrNumber(element, "x1", 0), attrNumber(element, "y1", 0), attrNumber(element, "x2", 0), attrNumber(element, "y2", 0)]
        : numberList(attribute(element, "points") ?? "");
    const points: Array<readonly [number, number]> = [];
    for (let index = 0; (index + 1) < coordinates.length; index += 2) points.push([frame.originX + (coordinates[index] * frame.scale), frame.originY + (coordinates[index + 1] * frame.scale)]);
    return points;
}

function shapeFor(element: ElementNode, name: string, frame: Frame, nextId: () => number): CT_Shape | null {
    const fillColor = hexColor(attribute(element, "fill"));
    const strokeColor = hexColor(attribute(element, "stroke"));
    const strokeWidth = attrNumber(element, "stroke-width", 1) * frame.scale;
    if (isPresetTag(element.tag)) {
        const box = presetBox(element.tag, element, frame);
        return presetShape(nextId, name, presetFor(element.tag, element), box.x, box.y, box.width, box.height, fillColor, strokeColor, strokeWidth);
    }
    const points = pointsFor(element.tag, element, frame);
    if (points.length < 2) return null;
    const box = { x: frame.originX, y: frame.originY, width: frame.width, height: frame.height };
    return customShape(nextId, name, points, box, element.tag === "polygon", fillColor, strokeColor, strokeWidth);
}

// Lowers each SVG primitive to a native shape keyed per shape, so PowerPoint's morph tweens fill and geometry
// across slides and fades shapes a slide introduces. Returns null when a non-shape element forces rasterisation.
export function svgToShapes(svg: ElementNode, nextId: () => number, x: number, y: number, width: number): { shapes: Array<CT_Shape>, height: number } | null {
    if (!convertible(svg)) return null;
    const frame = frameOf(svg, x, y, width);
    const rootKey = attribute(svg, "data-morph") ?? "svg";
    const counts = new Map<string, number>();
    const shapes: Array<CT_Shape> = [];
    for (const element of descendants(svg)) {
        const index = counts.get(element.tag) ?? 0;
        counts.set(element.tag, index + 1);
        const key = attribute(element, "data-morph") ?? `${rootKey}:${element.tag}:${index}`;
        const shape = shapeFor(element, morphName(key), frame, nextId);
        if (shape !== null) shapes.push(shape);
    }
    return { shapes, height: frame.height };
}
