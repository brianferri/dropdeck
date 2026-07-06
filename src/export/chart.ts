import { ChartKind } from "#/ir";
import type { ChartData } from "#/ir";

function niceCeil(value: number): number {
    if (value <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    return Math.ceil(value / magnitude) * magnitude;
}

function stackTotalMax(data: ChartData): number {
    let totalMax = 0;
    for (let category = 0; category < data.categories.length; category += 1) {
        let sum = 0;
        for (const series of data.series) sum += series.values[category] ?? 0;
        totalMax = Math.max(totalMax, sum);
    }
    return totalMax;
}

// Round the axis maximum up to a clean value (e.g. 240 -> 300) so bars read against a sensible scale. A stacked
// chart scales to the tallest column total rather than the tallest single value.
export function chartMax(data: ChartData): number {
    if (data.kind === ChartKind.Stacked) return niceCeil(stackTotalMax(data));
    let valueMax = 0;
    for (const series of data.series) for (const value of series.values) valueMax = Math.max(valueMax, value);
    return niceCeil(valueMax);
}

export function pickAccent<T>(accents: ReadonlyArray<T>, index: number): T {
    return accents[index % accents.length];
}

export type PieSlice = {
    readonly startFraction: number,
    readonly endFraction: number
};

// Cumulative fractions [0, 1] around the circle for a pie's slices; negative values are clamped to 0 and an
// all-zero series yields no slices rather than a divide-by-zero.
export function pieSlices(values: ReadonlyArray<number>): Array<PieSlice> {
    let total = 0;
    for (const value of values) total += Math.max(0, value);
    if (total <= 0) return [];
    const slices: Array<PieSlice> = [];
    let cursor = 0;
    for (const value of values) {
        const next = cursor + (Math.max(0, value) / total);
        slices.push({ startFraction: cursor, endFraction: next });
        cursor = next;
    }
    return slices;
}
