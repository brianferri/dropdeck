import { CssNodeKind, CssValueKind } from "./Specification.js";
import { parseValue, serializeValue } from "./Value.js";
import type { Declaration, Rule, AtRule, Stylesheet } from "./Specification.js";
import type { ParseValue, SerializeValue } from "./Value.js";
import type {
    Block, ComponentValues, Delimiter, Dimension, FunctionValue,
    Hash, Keyword, NumberValue, Percentage, Separator, StringValue
} from "./Specification.js";

export function declaration<const Property extends string, const Value extends string>(property: Property, value: Value): Declaration<Property, SerializeValue<ParseValue<Value>>> {
    return { kind: CssNodeKind.Declaration, property, value: serializeValue(parseValue(value)), important: false };
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

export function keyword<const Name extends string>(name: Name): Keyword<Name> {
    return { kind: CssValueKind.Keyword, name };
}

export function numberValue<const Text extends string>(text: Text): NumberValue<Text> {
    return { kind: CssValueKind.Number, text };
}

export function dimension<const Value extends string, const Unit extends string>(value: Value, unit: Unit): Dimension<Value, Unit> {
    return { kind: CssValueKind.Dimension, value, unit };
}

export function percentage<const Value extends string>(value: Value): Percentage<Value> {
    return { kind: CssValueKind.Percentage, value };
}

export function stringValue<const Text extends string>(text: Text): StringValue<Text> {
    return { kind: CssValueKind.Str, text };
}

export function hash<const Text extends string>(text: Text): Hash<Text> {
    return { kind: CssValueKind.Hash, text };
}

export function delimiter<const Char extends string>(char: Char): Delimiter<Char> {
    return { kind: CssValueKind.Delimiter, char };
}

export function separator<const Char extends "," | " ">(char: Char): Separator<Char> {
    return { kind: CssValueKind.Separator, char };
}

export function functionValue<const Name extends string, const Value extends ComponentValues>(name: Name, value: Value): FunctionValue<Name, Value> {
    return { kind: CssValueKind.Function, name, value };
}

export function block<const Open extends "(" | "[" | "{", const Value extends ComponentValues>(open: Open, value: Value): Block<Open, Value> {
    return { kind: CssValueKind.Block, open, value };
}
