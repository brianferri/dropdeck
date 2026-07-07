import { dimension, functionValue, keyword, numberValue, percentage, separator, serializeTransform, serializeValue } from "@dropdeck/html/css";
import type { ComponentValue, Dimension, FunctionValue, NumberValue } from "@dropdeck/html/css";
import { TRANSITION_EASING, TRANSITION_MS } from "#/animations/spec";

const SPACE = separator(" ");
const COMMA = separator(",");
const REVEAL_RISE_PX = 18;

function pxOf<const V extends number>(value: V): Dimension<`${V}`, "px"> {
    return dimension(`${value}`, "px");
}

function numOf<const V extends number>(value: V): NumberValue<`${V}`> {
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

export function revealRise(): `0 ${typeof REVEAL_RISE_PX}px` {
    return serializeValue([numOf(0), SPACE, pxOf(REVEAL_RISE_PX)]);
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

export function chartTransition(property: string, durationMs: number, delayMs: number): string {
    return serializeValue(transitionEntry(property, durationMs, BAR_GROW_EASING, delayMs));
}

export function percent<const V extends string>(value: V): `${V}%` {
    return serializeValue([percentage(value)]);
}

export function verticalScale<const V extends number>(value: V): `scaleY(${V})` {
    return serializeTransform([functionValue("scaleY", [numOf(value)])]);
}

export function clipRight<const P extends number>(pct: P): `inset(0 ${P}% 0 0)` {
    return serializeValue([functionValue("inset", [numOf(0), SPACE, percentage(`${pct}`), SPACE, numOf(0), SPACE, numOf(0)])]);
}

export function turn<const V extends number>(value: V): `${V}turn` {
    return serializeValue([dimension(`${value}`, "turn")]);
}

export function origin<const X extends number, const Y extends number>(xPx: X, yPx: Y): `${X}px ${Y}px` {
    return serializeValue([pxOf(xPx), SPACE, pxOf(yPx)]);
}

export function rgbColor<const R extends number, const G extends number, const B extends number>(red: R, green: G, blue: B): `rgb(${R}, ${G}, ${B})` {
    return serializeValue([functionValue("rgb", [numOf(red), COMMA, SPACE, numOf(green), COMMA, SPACE, numOf(blue)])]);
}

export function flipTransform<const DX extends number, const DY extends number, const SX extends number, const SY extends number>(
    dxPx: DX,
    dyPx: DY,
    scaleX: SX,
    scaleY: SY
): `translate3d(${DX}px, ${DY}px, 0) scale(${SX}, ${SY})` {
    const move = functionValue("translate3d", [pxOf(dxPx), COMMA, SPACE, pxOf(dyPx), COMMA, SPACE, numOf(0)]);
    const zoom = functionValue("scale", [numOf(scaleX), COMMA, SPACE, numOf(scaleY)]);
    return serializeTransform([move, zoom]);
}

export function flipRest(): "translate3d(0px, 0px, 0) scale(1, 1)" {
    return flipTransform(0, 0, 1, 1);
}
