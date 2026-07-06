import { div, span } from "#/dom";
import { element } from "@dropdeck/html";
import { declaration } from "@dropdeck/html/css";
import { chartMax, pieSlices } from "#/export/chart";
import { ChartKind } from "#/ir";
import type { DomNode, ElementNode } from "#/dom";
import type { ChartData } from "#/ir";

// SVG lines/fills are drawn in a fixed 1000x400 user space that CSS stretches to the plot; category i sits at the
// centre of its 1/n slot so a point lines up with its bar and its x-axis label.
const PLOT_WIDTH = 1000;
const PLOT_HEIGHT = 400;

function svgEl(tag: string, attrs: ReadonlyArray<readonly [string, string]>, children: ReadonlyArray<DomNode> = []): ElementNode {
    return element(tag, attrs, children);
}

function barDiv(value: number, max: number, klass: string): ElementNode<"div"> {
    const heightPercent = Math.max(0, Math.round((value / max) * 100));
    return div({ class: klass, style: [declaration("height", `${heightPercent}%`)] });
}

function barColumn(data: ChartData, categoryIndex: number, max: number): ElementNode<"div"> {
    return div({ class: "chart-col" }, data.series.map((series) => barDiv(series.values[categoryIndex] ?? 0, max, "chart-bar")));
}

// Only the topmost non-zero segment gets the rounded cap, so the column reads as one bar (matching the PPTX
// stack); a trailing zero-height series must not steal the cap, hence the last-positive index rather than `:last`.
function stackColumn(data: ChartData, categoryIndex: number, max: number): ElementNode<"div"> {
    let topIndex = -1;
    data.series.forEach((series, index) => { if ((series.values[categoryIndex] ?? 0) > 0) topIndex = index; });
    const segments = data.series.map((series, index) => barDiv(
        series.values[categoryIndex] ?? 0,
        max,
        index === topIndex ? "chart-seg chart-seg-cap" : "chart-seg"
    ));
    return div({ class: "chart-col chart-stack" }, segments);
}

function seriesPoints(values: ReadonlyArray<number>, max: number, count: number): string {
    return values.map((value, index) => {
        const x = ((index + 0.5) / Math.max(1, count)) * PLOT_WIDTH;
        const y = PLOT_HEIGHT - (Math.max(0, Math.min(1, value / max)) * PLOT_HEIGHT);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
}

function lineSeries(values: ReadonlyArray<number>, max: number, count: number, filled: boolean): ElementNode {
    const points = seriesPoints(values, max, count);
    const children: Array<DomNode> = [];
    if (filled) {
        const first = (0.5 / Math.max(1, count)) * PLOT_WIDTH;
        const last = ((count - 0.5) / Math.max(1, count)) * PLOT_WIDTH;
        children.push(svgEl("polygon", [["class", "chart-fill"], ["points", `${first.toFixed(1)},${PLOT_HEIGHT} ${points} ${last.toFixed(1)},${PLOT_HEIGHT}`]]));
    }
    children.push(svgEl("polyline", [["class", "chart-stroke"], ["points", points]]));
    return svgEl("g", [["class", "chart-series"]], children);
}

function lineSvg(data: ChartData, max: number, filled: boolean): ElementNode {
    const count = data.categories.length;
    const groups = data.series.map((series) => lineSeries(series.values, max, count, filled));
    return svgEl("svg", [["class", "chart-svg"], ["viewBox", `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`], ["preserveAspectRatio", "none"]], groups);
}

function cartesianNode(data: ChartData, max: number, plot: ReadonlyArray<DomNode>): ElementNode<"div"> {
    const labels = data.categories.map((category) => div({ class: "chart-xlabel" }, category));
    const axis = div({ class: "chart-axis" }, span({}, String(max)), span({}, "0"));
    const keys = data.series.map((series) => div({ class: "chart-key" }, span({ class: "chart-swatch" }), span({}, series.name)));
    return div(
        { class: "panel chart mt-2", data: { animation: "reveal" } },
        div({ class: "chart-frame" }, axis, div({ class: "chart-plot" }, plot), div({ class: "chart-xaxis" }, labels)),
        div({ class: "chart-legend" }, keys)
    );
}

const PIE_CX = 50;
const PIE_CY = 50;
const PIE_R = 42;

// Slices start at the top (12 o'clock) and sweep clockwise; a fraction over half the circle needs the SVG
// large-arc flag so the arc takes the long way round.
function arcPath(startFraction: number, endFraction: number): string {
    const start = (startFraction * 2 * Math.PI) - (Math.PI / 2);
    const end = (endFraction * 2 * Math.PI) - (Math.PI / 2);
    const x0 = PIE_CX + (PIE_R * Math.cos(start));
    const y0 = PIE_CY + (PIE_R * Math.sin(start));
    const x1 = PIE_CX + (PIE_R * Math.cos(end));
    const y1 = PIE_CY + (PIE_R * Math.sin(end));
    const large = endFraction - startFraction > 0.5 ? 1 : 0;
    return `M${PIE_CX},${PIE_CY} L${x0.toFixed(2)},${y0.toFixed(2)} A${PIE_R},${PIE_R} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}

function pieShapes(values: ReadonlyArray<number>): Array<DomNode> {
    const slices = pieSlices(values);
    // A single non-zero value is a full circle, whose start and end points coincide and would collapse an arc.
    if (slices.length === 1) return [svgEl("circle", [["class", "chart-slice"], ["cx", String(PIE_CX)], ["cy", String(PIE_CY)], ["r", String(PIE_R)]])];
    return slices.map((slice) => svgEl("path", [["class", "chart-slice"], ["d", arcPath(slice.startFraction, slice.endFraction)]]));
}

function pieNode(data: ChartData): ElementNode<"div"> {
    const values = data.series[0]?.values ?? [];
    const svg = svgEl("svg", [["class", "chart-pie"], ["viewBox", "0 0 100 100"]], pieShapes(values));
    const keys = data.categories.map((category) => div({ class: "chart-key" }, span({ class: "chart-swatch" }), span({}, category)));
    return div(
        { class: "panel chart chart-pie-panel mt-2", data: { animation: "reveal" } },
        div({ class: "chart-pie-wrap" }, svg),
        div({ class: "chart-legend" }, keys)
    );
}

export function chartNode(data: ChartData): ElementNode<"div"> {
    if (data.kind === ChartKind.Pie) return pieNode(data);
    const max = chartMax(data);
    if (data.kind === ChartKind.Line) return cartesianNode(data, max, [lineSvg(data, max, false)]);
    if (data.kind === ChartKind.Area) return cartesianNode(data, max, [lineSvg(data, max, true)]);
    if (data.kind === ChartKind.Stacked) return cartesianNode(data, max, data.categories.map((_, index) => stackColumn(data, index, max)));
    return cartesianNode(data, max, data.categories.map((_, index) => barColumn(data, index, max)));
}
