import { Align, Anchor, barRect, customShape, panel } from "#/export/pptx/build";
import { PANEL_PAD, PANEL_RADIUS, glassPanel, lowered, runBox } from "#/export/pptx/lower";
import { chartMax, pickAccent, pieSlices } from "#/export/chart";
import { ChartKind } from "#/ir";
import type { Embed, Lowered } from "#/export/pptx/lower";
import type { Palette } from "#/export/pptx/palette";
import type { RunStyle } from "#/export/pptx/build";
import type { ChartData } from "#/ir";
import type { Node } from "@dropdeck/pptx";

const CHART_PLOT_HEIGHT = 220;
const CHART_LABEL_HEIGHT = 24;
const CHART_LEGEND_HEIGHT = 30;
const CHART_BAR_GAP = 6;
const CHART_BAR_WIDTH_MAX = 40;
const CHART_AXIS_GUTTER = 42;
const CHART_GRID_LINES = 4;

const CHART_HEIGHT = CHART_PLOT_HEIGHT + CHART_LABEL_HEIGHT + CHART_LEGEND_HEIGHT + (2 * PANEL_PAD);
const CHART_AREA_FILL_OPACITY = 16;
const CHART_ARC_STEPS_MAX = 48;

function chartAccent(palette: Palette, index: number): string {
    return pickAccent(palette.accents, index);
}

type ChartBox = {
    plotX: number,
    plotWidth: number,
    plotTop: number,
    plotBottom: number,
    groupWidth: number,
    max: number
};

function chartBox(data: ChartData, x: number, y: number, width: number): ChartBox {
    const plotX = x + PANEL_PAD + CHART_AXIS_GUTTER;
    const plotTop = y + PANEL_PAD;
    return {
        plotX,
        plotWidth: width - (2 * PANEL_PAD) - CHART_AXIS_GUTTER,
        plotTop,
        plotBottom: plotTop + CHART_PLOT_HEIGHT,
        groupWidth: (width - (2 * PANEL_PAD) - CHART_AXIS_GUTTER) / Math.max(1, data.categories.length),
        max: chartMax(data)
    };
}

// Four evenly spaced gridlines with the max and 0 labels in the left gutter mirror the HTML chart's axis, so
// values read against the same scale in both exports.
function chartGrid(nextId: () => number, palette: Palette, box: ChartBox): Array<Node> {
    const shapes: Array<Node> = [];
    for (let line = 0; line <= CHART_GRID_LINES; line += 1) {
        const gridY = box.plotTop + ((CHART_PLOT_HEIGHT * line) / CHART_GRID_LINES);
        shapes.push(panel(nextId, box.plotX, gridY, box.plotWidth, 1, palette.borderColor, 0, palette.borderOpacity));
    }
    const axisStyle: RunStyle = { sizePx: 11, color: palette.muted, font: palette.body };
    const axisWidth = CHART_AXIS_GUTTER - 8;
    shapes.push(runBox(nextId, box.plotX - CHART_AXIS_GUTTER, box.plotTop - 8, axisWidth, 16, Anchor.Top, Align.Right, String(box.max), axisStyle, 0));
    shapes.push(runBox(nextId, box.plotX - CHART_AXIS_GUTTER, box.plotBottom - 8, axisWidth, 16, Anchor.Top, Align.Right, "0", axisStyle, 0));
    return shapes;
}

// The swatch widths approximate the glyph run so the row reads as one balanced strip centred under the plot.
function chartLegend(nextId: () => number, palette: Palette, names: ReadonlyArray<string>, x: number, y: number, width: number): Array<Node> {
    const swatch = 12;
    const textGap = 6;
    const keyGap = 22;
    const textWidths = names.map((name) => (name.length * 9) + 12);
    let total = keyGap * Math.max(0, names.length - 1);
    for (const value of textWidths) total += swatch + textGap + value;
    let cursorX = x + Math.max(0, (width - total) / 2);
    const shapes: Array<Node> = [];
    names.forEach((name, index) => {
        shapes.push(panel(nextId, cursorX, y + 3, swatch, swatch, chartAccent(palette, index), 3));
        shapes.push(runBox(nextId, cursorX + swatch + textGap, y - 4, textWidths[index], 22, Anchor.Top, Align.Left, name, { sizePx: 13, color: palette.secondary, font: palette.body }, 0));
        cursorX += swatch + textGap + textWidths[index] + keyGap;
    });
    return shapes;
}

function chartLabels(nextId: () => number, palette: Palette, data: ChartData, box: ChartBox): Array<Node> {
    const style: RunStyle = { sizePx: 13, color: palette.secondary, font: palette.body };
    return data.categories.map((category, index) => runBox(nextId, box.plotX + (box.groupWidth * index), box.plotBottom + 4, box.groupWidth, CHART_LABEL_HEIGHT, Anchor.Top, Align.Center, category, style));
}

function barY(value: number, box: ChartBox): number {
    return Math.max(2, Math.round(((value) / box.max) * CHART_PLOT_HEIGHT));
}

function groupedBars(nextId: () => number, palette: Palette, data: ChartData, box: ChartBox): Array<Node> {
    const shapes: Array<Node> = [];
    const seriesCount = Math.max(1, data.series.length);
    const barWidth = Math.min(CHART_BAR_WIDTH_MAX, (box.groupWidth - (CHART_BAR_GAP * (seriesCount + 1))) / seriesCount);
    const cluster = (seriesCount * barWidth) + ((seriesCount - 1) * CHART_BAR_GAP);
    data.categories.forEach((_, categoryIndex) => {
        const clusterX = box.plotX + (box.groupWidth * categoryIndex) + ((box.groupWidth - cluster) / 2);
        data.series.forEach((series, seriesIndex) => {
            const height = barY(series.values[categoryIndex] ?? 0, box);
            shapes.push(barRect(nextId, clusterX + (seriesIndex * (barWidth + CHART_BAR_GAP)), box.plotBottom - height, barWidth, height, chartAccent(palette, seriesIndex), 8));
        });
    });
    return shapes;
}

function stackedBars(nextId: () => number, palette: Palette, data: ChartData, box: ChartBox): Array<Node> {
    const shapes: Array<Node> = [];
    const barWidth = Math.min(CHART_BAR_WIDTH_MAX, box.groupWidth - 14);
    data.categories.forEach((_, categoryIndex) => {
        const barX = box.plotX + (box.groupWidth * categoryIndex) + ((box.groupWidth - barWidth) / 2);
        let topIndex = -1;
        data.series.forEach((series, seriesIndex) => { if ((series.values[categoryIndex] ?? 0) > 0) topIndex = seriesIndex; });
        let baseY = box.plotBottom;
        data.series.forEach((series, seriesIndex) => {
            const height = Math.max(0, Math.round(((series.values[categoryIndex] ?? 0) / box.max) * CHART_PLOT_HEIGHT));
            if (height <= 0) return;
            const color = chartAccent(palette, seriesIndex);
            shapes.push(seriesIndex === topIndex
                ? barRect(nextId, barX, baseY - height, barWidth, height, color, 8)
                : panel(nextId, barX, baseY - height, barWidth, height, color, 0));
            baseY -= height;
        });
    });
    return shapes;
}

function lineShapes(nextId: () => number, palette: Palette, data: ChartData, box: ChartBox, filled: boolean): Array<Node> {
    const shapes: Array<Node> = [];
    const count = data.categories.length;
    const rect = { x: box.plotX, y: box.plotTop, width: box.plotWidth, height: CHART_PLOT_HEIGHT };
    function pointX(index: number): number {
        return box.plotX + (((index + 0.5) / Math.max(1, count)) * box.plotWidth);
    }
    function pointY(value: number): number {
        return box.plotBottom - (Math.max(0, Math.min(1, value / box.max)) * CHART_PLOT_HEIGHT);
    }
    data.series.forEach((series, seriesIndex) => {
        const color = chartAccent(palette, seriesIndex);
        const points = series.values.map((value, index) => [pointX(index), pointY(value)] as const);
        if (filled) {
            const region = points.concat([[pointX(count - 1), box.plotBottom], [pointX(0), box.plotBottom]]);
            shapes.push(customShape(nextId, "area", region, rect, true, color, null, 0, CHART_AREA_FILL_OPACITY));
        }
        shapes.push(customShape(nextId, "line", points, rect, false, null, color, 2.5));
    });
    return shapes;
}

function plotShapes(data: ChartData, embed: Embed, box: ChartBox): Array<Node> {
    const { nextId, palette } = embed;
    if (data.kind === ChartKind.Stacked) return stackedBars(nextId, palette, data, box);
    if (data.kind === ChartKind.Line) return lineShapes(nextId, palette, data, box, false);
    if (data.kind === ChartKind.Area) return lineShapes(nextId, palette, data, box, true);
    return groupedBars(nextId, palette, data, box);
}

// A slice is a fan of triangles to the centre, robust to the full-circle case a preset pie geometry mishandles.
function pieSliceShape(nextId: () => number, centerX: number, centerY: number, radius: number, start: number, end: number, color: string): Node {
    const points: Array<readonly [number, number]> = [[centerX, centerY]];
    const steps = Math.max(2, Math.ceil((end - start) * CHART_ARC_STEPS_MAX));
    for (let step = 0; step <= steps; step += 1) {
        const angle = (((start + ((end - start) * (step / steps))) * 2 * Math.PI)) - (Math.PI / 2);
        points.push([centerX + (radius * Math.cos(angle)), centerY + (radius * Math.sin(angle))]);
    }
    return customShape(nextId, "slice", points, { x: centerX - radius, y: centerY - radius, width: 2 * radius, height: 2 * radius }, true, color, null, 0);
}

function lowerPie(data: ChartData, embed: Embed, x: number, y: number, width: number): Lowered {
    const { nextId, palette } = embed;
    const shapes: Array<Node> = [glassPanel(nextId, x, y, width, CHART_HEIGHT, palette, PANEL_RADIUS)];
    const radius = CHART_PLOT_HEIGHT / 2;
    const centerX = x + (width / 2);
    const centerY = y + PANEL_PAD + radius;
    pieSlices(data.series[0]?.values ?? []).forEach((slice, index) => shapes.push(pieSliceShape(nextId, centerX, centerY, radius, slice.startFraction, slice.endFraction, chartAccent(palette, index))));
    for (const shape of chartLegend(nextId, palette, data.categories, x + PANEL_PAD, centerY + radius + CHART_LABEL_HEIGHT, width - (2 * PANEL_PAD))) shapes.push(shape);
    return lowered(shapes, CHART_HEIGHT);
}

export function lowerChart(data: ChartData, embed: Embed, x: number, y: number, width: number): Lowered {
    if (data.kind === ChartKind.Pie) return lowerPie(data, embed, x, y, width);
    const { nextId, palette } = embed;
    const box = chartBox(data, x, y, width);
    const shapes: Array<Node> = [glassPanel(nextId, x, y, width, CHART_HEIGHT, palette, PANEL_RADIUS)];
    for (const shape of chartGrid(nextId, palette, box)) shapes.push(shape);
    for (const shape of plotShapes(data, embed, box)) shapes.push(shape);
    for (const shape of chartLabels(nextId, palette, data, box)) shapes.push(shape);
    const names = data.series.map((series) => series.name);
    for (const shape of chartLegend(nextId, palette, names, x + PANEL_PAD, box.plotBottom + CHART_LABEL_HEIGHT + 8, width - (2 * PANEL_PAD))) shapes.push(shape);
    return lowered(shapes, CHART_HEIGHT);
}
