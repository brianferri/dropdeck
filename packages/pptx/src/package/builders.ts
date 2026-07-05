import { Namespace, element } from "../oox.js";
import type { Element, Empty } from "../oox.js";
import type { TargetMode } from "./Specification.js";
import type { CT_Default, CT_Override, CT_Relationship } from "./Specification.js";

export function defaultType<const E extends string, const C extends string>(
    extension: E,
    contentType: C
): Element<"Default", readonly [readonly ["Extension", E], readonly ["ContentType", C]], Empty> {
    return element("Default", [["Extension", extension], ["ContentType", contentType]], []);
}

export function override<const P extends string, const C extends string>(
    partName: P,
    contentType: C
): Element<"Override", readonly [readonly ["PartName", P], readonly ["ContentType", C]], Empty> {
    return element("Override", [["PartName", partName], ["ContentType", contentType]], []);
}

export function contentTypes<const E extends ReadonlyArray<CT_Default | CT_Override>>(entries: E): Element<"Types", readonly [readonly ["xmlns", Namespace.ct]], E> {
    return element("Types", [["xmlns", Namespace.ct]], entries);
}

type RelAttrs<I extends string, T extends string, G extends string> =
    readonly [readonly ["Id", I], readonly ["Type", T], readonly ["Target", G]];
export function relationship<const I extends string, const T extends string, const G extends string>(
    id: I,
    type: T,
    target: G
): Element<"Relationship", RelAttrs<I, T, G>, Empty>;
export function relationship<const I extends string, const T extends string, const G extends string, const M extends TargetMode>(
    id: I,
    type: T,
    target: G,
    mode: M
): Element<"Relationship", readonly [...RelAttrs<I, T, G>, readonly ["TargetMode", M]], Empty>;
export function relationship(id: string, type: string, target: string, mode?: TargetMode): CT_Relationship {
    if (mode === undefined) return element("Relationship", [["Id", id], ["Type", type], ["Target", target]], []);
    return element("Relationship", [["Id", id], ["Type", type], ["Target", target], ["TargetMode", mode]], []);
}

export function relationships<const I extends ReadonlyArray<CT_Relationship>>(items: I): Element<"Relationships", readonly [readonly ["xmlns", Namespace.rel]], I> {
    return element("Relationships", [["xmlns", Namespace.rel]], items);
}
