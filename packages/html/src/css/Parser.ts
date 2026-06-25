// The parser walks a buffered token array rather than pulling lazily: the qualified-rule-vs-declaration decision
// needs to look ahead to the next `{` or `;`, which a one-token cursor cannot do without a separate stack.

import { CssTokenKind, nextToken } from "./Tokenizer.js";
import { cursor } from "../scan/Cursor.js";
import { CssNodeKind } from "./Specification.js";
import type { CssToken } from "./Tokenizer.js";
import type { AtRule, Declaration, Rule, StyleNode, Stylesheet } from "./Specification.js";
import type { ParseStyle, ParseStylesheet } from "./Parse.js";
type TokenCursor = {
    readonly tokens: ReadonlyArray<CssToken>,
    index: number
};

function tokenize(source: string): Array<CssToken> {
    const c = cursor(source);
    const tokens: Array<CssToken> = [];
    let token = nextToken(c);
    while (token.kind !== CssTokenKind.Eof) {
        tokens.push(token);
        token = nextToken(c);
    }
    return tokens;
}

function peekKind(tc: TokenCursor): CssTokenKind {
    if (tc.index >= tc.tokens.length) return CssTokenKind.Eof;
    return tc.tokens[tc.index].kind;
}

function joinTrimmed(tokens: ReadonlyArray<CssToken>): string {
    let out = "";
    for (const token of tokens) if (token.kind !== CssTokenKind.Comment) out += token.text;
    return out.trim();
}

// Commas nested in `()` are not selector separators, so `:is(a, b)` and `rgb(...)` stay intact.
function splitSelectors(prelude: ReadonlyArray<CssToken>): Array<string> {
    const selectors: Array<string> = [];
    let group: Array<CssToken> = [];
    let depth = 0;
    for (const token of prelude) {
        if (token.kind === CssTokenKind.ParenOpen) depth += 1;
        else if (token.kind === CssTokenKind.ParenClose && depth > 0) depth -= 1;
        if (token.kind === CssTokenKind.Comma && depth === 0) {
            selectors.push(joinTrimmed(group));
            group = [];
            continue;
        }
        group.push(token);
    }
    const last = joinTrimmed(group);
    if (last !== "" || selectors.length > 0) selectors.push(last);
    return selectors;
}

function takeImportant(value: ReadonlyArray<CssToken>): { value: string, important: boolean } {
    let end = value.length;
    while (end > 0 && (value[end - 1].kind === CssTokenKind.Whitespace || value[end - 1].kind === CssTokenKind.Comment)) end -= 1;
    if (end >= 2 &&
        value[end - 1].kind === CssTokenKind.Ident &&
        value[end - 1].text.toLowerCase() === "important" &&
        value[end - 2].kind === CssTokenKind.Delim &&
        value[end - 2].text === "!") {
        return {
            value: joinTrimmed(value.slice(0, end - 2)),
            important: true
        };
    }

    return { value: joinTrimmed(value), important: false };
}

function declarationOf(prelude: ReadonlyArray<CssToken>): Declaration | null {
    let colon = -1;
    for (let index = 0; index < prelude.length; index += 1) {
        if (prelude[index].kind === CssTokenKind.Colon) {
            colon = index;
            break;
        }
    }
    if (colon === -1) return null;
    const property = joinTrimmed(prelude.slice(0, colon));
    if (property === "") return null;
    const tail = takeImportant(prelude.slice(colon + 1));
    return { kind: CssNodeKind.Declaration, property, value: tail.value, important: tail.important };
}

function readPrelude(tc: TokenCursor): Array<CssToken> {
    const prelude: Array<CssToken> = [];
    while (true) {
        const kind = peekKind(tc);
        if (kind === CssTokenKind.Eof || kind === CssTokenKind.BraceOpen || kind === CssTokenKind.Semicolon || kind === CssTokenKind.BraceClose) return prelude;
        prelude.push(tc.tokens[tc.index]);
        tc.index += 1;
    }
}

function parseAtRule(tc: TokenCursor): AtRule {
    const name = tc.tokens[tc.index].text;
    tc.index += 1;
    const prelude = joinTrimmed(readPrelude(tc));
    if (peekKind(tc) === CssTokenKind.BraceOpen) {
        tc.index += 1;
        return { kind: CssNodeKind.AtRule, name, prelude, body: parseBlock(tc) };
    }
    if (peekKind(tc) === CssTokenKind.Semicolon) tc.index += 1;
    return { kind: CssNodeKind.AtRule, name, prelude, body: null };
}

function parseStatement(tc: TokenCursor): StyleNode | null {
    const prelude = readPrelude(tc);
    if (peekKind(tc) === CssTokenKind.BraceOpen) {
        tc.index += 1;
        const rule: Rule = { kind: CssNodeKind.Rule, selectors: splitSelectors(prelude), declarations: declarationsOf(parseBlock(tc)) };
        return rule;
    }
    if (peekKind(tc) === CssTokenKind.Semicolon) tc.index += 1;
    return declarationOf(prelude);
}

function declarationsOf(nodes: ReadonlyArray<StyleNode>): Array<Declaration> {
    const out: Array<Declaration> = [];
    for (const node of nodes) if (node.kind === CssNodeKind.Declaration) out.push(node);
    return out;
}

function parseBlock(tc: TokenCursor): Array<StyleNode> {
    const nodes: Array<StyleNode> = [];
    while (true) {
        const kind = peekKind(tc);
        if (kind === CssTokenKind.Eof) return nodes;
        if (kind === CssTokenKind.BraceClose) {
            tc.index += 1;
            return nodes;
        }
        if (kind === CssTokenKind.Whitespace || kind === CssTokenKind.Comment || kind === CssTokenKind.Semicolon) {
            tc.index += 1;
            continue;
        }
        const node = kind === CssTokenKind.AtKeyword ? parseAtRule(tc) : parseStatement(tc);
        if (node !== null) nodes.push(node);
    }
}

function buildSheet(source: string): Stylesheet {
    return parseBlock({ tokens: tokenize(source), index: 0 });
}

function buildStyle(source: string): ReadonlyArray<Declaration> {
    return declarationsOf(parseBlock({ tokens: tokenize(source), index: 0 }));
}

/**
 * The cast is sound because `buildSheet` produces the `ParseStylesheet<S>` tree by construction; for a literal
 * `S` the exact tree is visible on hover, while a runtime `string` widens to `Stylesheet`.
 */
export function parse<const S extends string>(source: S): ParseStylesheet<S> {
    return buildSheet(source) as ParseStylesheet<S>;
}

/**
 * Parses a bare declaration list -- an HTML `style="..."` attribute, with no selector or braces. The cast is
 * sound by construction; for a literal `S` the exact `ParseStyle<S>` tuple is visible, a runtime `string` widens.
 */
export function parseStyle<const S extends string>(source: S): ParseStyle<S> {
    return buildStyle(source) as ParseStyle<S>;
}
