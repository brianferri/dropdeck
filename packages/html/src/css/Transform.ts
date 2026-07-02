import { parseValue, serializeValue } from "./Value.js";
import { CssValueKind } from "./Specification.js";
import type { SerializeValue } from "./Value.js";
import type { FunctionValue } from "./Specification.js";

// A `transform` value is nothing more than the function component-values of a generic CSS value (see ./Value), so
// transform is a view over the spec. Resolving the list to a numeric matrix is ./Matrix.
export type TransformList = ReadonlyArray<FunctionValue>;

type JoinFunctions<T extends TransformList> =
    T extends readonly [infer Head extends FunctionValue, ...infer Rest extends TransformList]
        ? Rest extends readonly [] ? SerializeValue<readonly [Head]> : `${SerializeValue<readonly [Head]>} ${JoinFunctions<Rest>}`
        : "";

export type SerializeTransform<T extends TransformList> = JoinFunctions<T>;

// `null` -- an element with no `transform` declaration (`styleValue` returns it) -- is an empty list, so a consumer
// reads the declaration and hands the result straight in without defaulting.
export function parseTransform(value: string | null): TransformList {
    if (value === null) return [];
    const functions: Array<FunctionValue> = [];
    for (const node of parseValue(value)) if (node.kind === CssValueKind.Function) functions.push(node);
    return functions;
}

export function serializeTransform<const T extends TransformList>(list: T): SerializeTransform<T> {
    const parts: Array<string> = [];
    for (const fn of list) parts.push(serializeValue([fn]));
    return parts.join(" ") as SerializeTransform<T>;
}
