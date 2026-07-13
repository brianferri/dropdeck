import { isNameChar, isWhitespace } from "./Characters.js";
import { advance, cursor, eof, peek, readWhile, skipWhile } from "../scan/Cursor.js";
import type { Cursor } from "../typings/scan.js";
import type { ParseSelector } from "./ParseSelector.js";

export enum SelectorKind {
    Universal = "universal",
    Type = "type",
    Class = "class",
    Id = "id",
    Attribute = "attribute",
    PseudoClass = "pseudoClass",
    PseudoElement = "pseudoElement"
}

export enum Combinator {
    Descendant = "descendant",
    Child = "child",
    NextSibling = "nextSibling",
    SubsequentSibling = "subsequentSibling"
}

export type SimpleSelector<Kind extends SelectorKind = SelectorKind, Name extends string = string> = {
    readonly kind: Kind,
    readonly name: Name
};

// The first step carries a sentinel `Descendant` combinator, not a real one.
export type SelectorStep<C extends Combinator = Combinator, Compound extends ReadonlyArray<SimpleSelector> = ReadonlyArray<SimpleSelector>> = {
    readonly combinator: C,
    readonly compound: Compound
};

export type ComplexSelector = ReadonlyArray<SelectorStep>;

// Expects the opening bracket at the cursor; consumes the matching close but excludes it from the returned text.
function readBalanced(c: Cursor, open: string, close: string): string {
    advance(c);
    let depth = 1;
    let out = "";
    while (!eof(c) && depth > 0) {
        const character = advance(c);
        if (character === open) depth += 1;
        else if (character === close) {
            depth -= 1;
            if (depth === 0) break;
        }
        out += character;
    }
    return out;
}

function readSimple(c: Cursor): SimpleSelector | null {
    const lead = peek(c, 0);
    if (lead === "*") {
        advance(c);
        return { kind: SelectorKind.Universal, name: "*" };
    }
    if (lead === ".") {
        advance(c);
        return { kind: SelectorKind.Class, name: readWhile(c, isNameChar) };
    }
    if (lead === "#") {
        advance(c);
        return { kind: SelectorKind.Id, name: readWhile(c, isNameChar) };
    }
    if (lead === "[") return { kind: SelectorKind.Attribute, name: readBalanced(c, "[", "]") };
    if (lead === ":") {
        advance(c);
        const element = peek(c, 0) === ":";
        if (element) advance(c);
        const name = readWhile(c, isNameChar);
        const args = peek(c, 0) === "(" ? `(${readBalanced(c, "(", ")")})` : "";
        return { kind: element ? SelectorKind.PseudoElement : SelectorKind.PseudoClass, name: name + args };
    }
    const type = readWhile(c, isNameChar);
    if (type === "") return null;
    return { kind: SelectorKind.Type, name: type };
}

function readCompound(c: Cursor): Array<SimpleSelector> {
    const parts: Array<SimpleSelector> = [];
    while (!eof(c)) {
        const simple = readSimple(c);
        if (simple === null) break;
        parts.push(simple);
    }
    return parts;
}

function readCombinator(c: Cursor): Combinator {
    skipWhile(c, isWhitespace);
    const lead = peek(c, 0);
    if (lead === ">") {
        advance(c);
        skipWhile(c, isWhitespace);
        return Combinator.Child;
    }
    if (lead === "+") {
        advance(c);
        skipWhile(c, isWhitespace);
        return Combinator.NextSibling;
    }
    if (lead === "~") {
        advance(c);
        skipWhile(c, isWhitespace);
        return Combinator.SubsequentSibling;
    }
    return Combinator.Descendant;
}

function buildSelector(source: string): ComplexSelector {
    const c = cursor(source);
    const steps: Array<SelectorStep> = [];
    skipWhile(c, isWhitespace);
    let combinator = Combinator.Descendant;
    while (!eof(c)) {
        const compound = readCompound(c);
        if (compound.length === 0) break;
        steps.push({ combinator, compound });
        const before = c.offset;
        combinator = readCombinator(c);
        // No progress and no compound ahead means trailing junk; stop rather than spin.
        if (c.offset === before && isWhitespace(peek(c, -1))) continue;
    }
    return steps;
}

export function parseSelector<const S extends string>(source: S): ParseSelector<S> {
    return buildSelector(source) as ParseSelector<S>;
}
