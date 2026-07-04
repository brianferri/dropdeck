import { dimension, functionValue, keyword, numberValue, percentage, separator, serializeTransform, serializeValue } from "@dropdeck/html/css";
import type { ComponentValue, Dimension, FunctionValue, NumberValue } from "@dropdeck/html/css";
import { TRANSITION_EASING, TRANSITION_MS } from "#/animations/spec";

const SPACE = separator(" ");
const COMMA = separator(",");
const REVEAL_RISE_PX = 18;

function pxOf(value: number): Dimension<`${number}`, "px"> {
    return dimension(`${value}`, "px");
}

function numOf(value: number): NumberValue<`${number}`> {
    return numberValue(`${value}`);
}

function commaList(values: ReadonlyArray<ComponentValue>): Array<ComponentValue> {
    const out: Array<ComponentValue> = [];
    values.forEach((value, index) => {
        if (index > 0) out.push(COMMA, SPACE);
        out.push(value);
    });
    return out;
}

export function revealRise(): string {
    return serializeValue([numberValue("0"), SPACE, dimension(String(REVEAL_RISE_PX), "px")]);
}

// A `timing` of any component value lets a keyword (`ease-in-out`) and a `cubic-bezier(...)` curve share one path.
function transitionEntry(property: string, durationMs: number, timing: ComponentValue, delayMs: number): Array<ComponentValue> {
    const entry: Array<ComponentValue> = [keyword(property), SPACE, dimension(String(durationMs), "ms"), SPACE, timing];
    if (delayMs !== 0) entry.push(SPACE, dimension(String(delayMs), "ms"));
    return entry;
}

export function transitionOf(properties: ReadonlyArray<string>, delayMs: number): string {
    const value: Array<ComponentValue> = [];
    properties.forEach((property, index) => {
        if (index > 0) value.push(COMMA, SPACE);
        for (const node of transitionEntry(property, TRANSITION_MS, keyword(TRANSITION_EASING), delayMs)) value.push(node);
    });
    return serializeValue(value);
}

// The bars fill with a longer, decelerating curve of their own rather than the shared slide clock.
const BAR_GROW_MS = 700;
const BAR_GROW_EASING: FunctionValue = functionValue("cubic-bezier", commaList([numOf(0.22), numOf(1), numOf(0.36), numOf(1)]));

export function barGrow(delayMs: number): string {
    return serializeValue(transitionEntry("width", BAR_GROW_MS, BAR_GROW_EASING, delayMs));
}

export function percent(value: string): `${string}%` {
    return serializeValue([percentage(value)]);
}

export function origin(xPx: number, yPx: number): `${number}px ${number}px` {
    return serializeValue([pxOf(xPx), SPACE, pxOf(yPx)]);
}

export function rgbColor(red: number, green: number, blue: number): string {
    return serializeValue([functionValue("rgb", commaList([numOf(red), numOf(green), numOf(blue)]))]);
}

export function flipTransform(dxPx: number, dyPx: number, scaleX: number, scaleY: number): string {
    const move: FunctionValue = functionValue("translate3d", commaList([pxOf(dxPx), pxOf(dyPx), numOf(0)]));
    const zoom: FunctionValue = functionValue("scale", commaList([numOf(scaleX), numOf(scaleY)]));
    return serializeTransform([move, zoom]);
}

export function flipRest(): string {
    const move: FunctionValue = functionValue("translate3d", commaList([numOf(0), numOf(0), numOf(0)]));
    const zoom: FunctionValue = functionValue("scale", commaList([numOf(1), numOf(1)]));
    return serializeTransform([move, zoom]);
}
