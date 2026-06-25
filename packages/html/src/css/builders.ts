import { CssNodeKind } from "./Specification.js";
import type { Declaration, Rule, AtRule, Stylesheet } from "./Specification.js";

export function declaration<const Property extends string, const Value extends string>(property: Property, value: Value): {
    readonly kind: CssNodeKind.Declaration,
    readonly property: Property,
    readonly value: Value,
    readonly important: false
} {
    return { kind: CssNodeKind.Declaration, property, value, important: false };
}

export function rule<const Selectors extends ReadonlyArray<string>, const Body extends ReadonlyArray<Declaration>>(selectors: Selectors, declarations: Body): Rule<Selectors, Body> {
    return { kind: CssNodeKind.Rule, selectors, declarations };
}

export function atRule<const Name extends string, const Prelude extends string, const Body extends Stylesheet | null>(name: Name, prelude: Prelude, body: Body): AtRule<Name, Prelude, Body> {
    return { kind: CssNodeKind.AtRule, name, prelude, body };
}

export function importRule<const Url extends string>(url: Url): AtRule<"@import", `url("${Url}")`, null> {
    return atRule("@import", `url("${url}")`, null);
}
