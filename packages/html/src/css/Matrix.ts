import { CssValueKind } from "./Specification.js";
import type { ComponentValue, FunctionValue } from "./Specification.js";

// A 2D affine matrix -- the six numbers of CSS `matrix()`, the canonical form every 2D transform composes to.
// A point (x, y) maps to (a*x + c*y + e, b*x + d*y + f).
export type Matrix = readonly [number, number, number, number, number, number];

// What a target with no shear (a slide shape: position, size, one rotation) needs from an arbitrary matrix.
export type Decomposed = {
    translateXPx: number,
    translateYPx: number,
    rotateDeg: number,
    scaleX: number,
    scaleY: number,
    skewXDeg: number
};

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const DEGREES_PER_RADIAN = 180 / Math.PI;

function operands(fn: FunctionValue): Array<ComponentValue> {
    const values: Array<ComponentValue> = [];
    for (const node of fn.value) if (node.kind !== CssValueKind.Separator) values.push(node);
    return values;
}

function scalar(operand: ComponentValue | undefined, fallback: number): number {
    if (operand === undefined) return fallback;
    if (operand.kind === CssValueKind.Dimension) return Number(operand.value);
    if (operand.kind === CssValueKind.Number) return Number(operand.text);
    if (operand.kind === CssValueKind.Percentage) return Number(operand.value) / 100;
    return fallback;
}

// An operand read as radians. A bare number is treated as degrees (CSS only allows unitless `0`, which is 0 either
// way); `grad` is tested before `rad` because it also ends in "rad".
function radians(operand: ComponentValue | undefined): number {
    if (operand === undefined) return 0;
    if (operand.kind === CssValueKind.Number) return (Number(operand.text) * Math.PI) / 180;
    if (operand.kind !== CssValueKind.Dimension) return 0;
    const value = Number(operand.value);
    if (operand.unit === "turn") return value * 2 * Math.PI;
    if (operand.unit === "grad") return (value * Math.PI) / 200;
    if (operand.unit === "rad") return value;
    return (value * Math.PI) / 180;
}

function multiply(left: Matrix, right: Matrix): Matrix {
    const [a1, b1, c1, d1, e1, f1] = left;
    const [a2, b2, c2, d2, e2, f2] = right;
    return [
        (a1 * a2) + (c1 * b2),
        (b1 * a2) + (d1 * b2),
        (a1 * c2) + (c1 * d2),
        (b1 * c2) + (d1 * d2),
        (a1 * e2) + (c1 * f2) + e1,
        (b1 * e2) + (d1 * f2) + f1
    ];
}

// Lengths are read as px; a function with no 2D form (rotateX, perspective, matrix3d, ...) is the identity.
function functionMatrix(fn: FunctionValue): Matrix {
    const a = operands(fn);
    if (fn.name === "matrix") return [scalar(a[0], 1), scalar(a[1], 0), scalar(a[2], 0), scalar(a[3], 1), scalar(a[4], 0), scalar(a[5], 0)];
    if (fn.name === "translate" || fn.name === "translate3d") return [1, 0, 0, 1, scalar(a[0], 0), scalar(a[1], 0)];
    if (fn.name === "translateX") return [1, 0, 0, 1, scalar(a[0], 0), 0];
    if (fn.name === "translateY") return [1, 0, 0, 1, 0, scalar(a[0], 0)];
    if (fn.name === "scale" || fn.name === "scale3d") {
        const scaleX = scalar(a[0], 1);
        return [scaleX, 0, 0, scalar(a[1], scaleX), 0, 0];
    }
    if (fn.name === "scaleX") return [scalar(a[0], 1), 0, 0, 1, 0, 0];
    if (fn.name === "scaleY") return [1, 0, 0, scalar(a[0], 1), 0, 0];
    if (fn.name === "rotate" || fn.name === "rotateZ") {
        const theta = radians(a[0]);
        return [Math.cos(theta), Math.sin(theta), -Math.sin(theta), Math.cos(theta), 0, 0];
    }
    if (fn.name === "skewX") return [1, 0, Math.tan(radians(a[0])), 1, 0, 0];
    if (fn.name === "skewY") return [1, Math.tan(radians(a[0])), 0, 1, 0, 0];
    if (fn.name === "skew") return [1, Math.tan(radians(a[1])), Math.tan(radians(a[0])), 1, 0, 0];
    return IDENTITY;
}

// Composes a transform's functions into one matrix, left to right, the way CSS applies them.
export function matrixOf(list: ReadonlyArray<FunctionValue>): Matrix {
    let matrix: Matrix = IDENTITY;
    for (const fn of list) matrix = multiply(matrix, functionMatrix(fn));
    return matrix;
}

// Splits a matrix into translation, rotation, per-axis scale and x-skew (the "unmatrix" decomposition). Angles in
// degrees. A negative determinant is folded into `scaleX` so rotation stays the pure spin a shape can apply.
export function decompose(matrix: Matrix): Decomposed {
    let [a, b, c, d] = matrix;
    const [, , , , e, f] = matrix;
    let scaleX = Math.hypot(a, b);
    if (scaleX !== 0) {
        a /= scaleX;
        b /= scaleX;
    }
    let shear = (a * c) + (b * d);
    c -= a * shear;
    d -= b * shear;
    const scaleY = Math.hypot(c, d);
    if (scaleY !== 0) shear /= scaleY;
    if (((a * d) - (b * c)) < 0) {
        a = -a;
        b = -b;
        scaleX = -scaleX;
        shear = -shear;
    }
    return {
        translateXPx: e,
        translateYPx: f,
        rotateDeg: Math.atan2(b, a) * DEGREES_PER_RADIAN,
        scaleX,
        scaleY,
        skewXDeg: Math.atan(shear) * DEGREES_PER_RADIAN
    };
}
