import { isDigit, isIdentStart, isNameChar, isWhitespace } from "./Characters.js";
import { advance, eof, peek, readUntil, readWhile } from "../scan/Cursor.js";
import type { Cursor } from "../scan/Cursor.js";
export enum CssTokenKind {
    AtKeyword = "atKeyword",
    Ident = "ident",
    Url = "url",
    Hash = "hash",
    Str = "string",
    Number = "number",
    Dimension = "dimension",
    Percentage = "percentage",
    Delim = "delim",
    Colon = "colon",
    Semicolon = "semicolon",
    Comma = "comma",
    BraceOpen = "braceOpen",
    BraceClose = "braceClose",
    ParenOpen = "parenOpen",
    ParenClose = "parenClose",
    Whitespace = "whitespace",
    Comment = "comment",
    Eof = "eof"
}

export type CssToken = {
    readonly kind: CssTokenKind,
    readonly text: string
};

function single(c: Cursor, kind: CssTokenKind): CssToken {
    return { kind, text: advance(c) };
}

function readString(c: Cursor): CssToken {
    const quote = advance(c);
    const value = readUntil(c, quote);
    const closed = peek(c, 0) === quote;
    if (closed) advance(c);
    return { kind: CssTokenKind.Str, text: closed ? quote + value + quote : quote + value };
}

function readComment(c: Cursor): CssToken {
    advance(c);
    advance(c);
    const body = readUntil(c, "*/");
    const closed = peek(c, 0) === "*";
    if (closed) {
        advance(c);
        advance(c);
    }
    return { kind: CssTokenKind.Comment, text: closed ? `/*${body}*/` : `/*${body}` };
}

function readHash(c: Cursor): CssToken {
    const hash = advance(c);
    return { kind: CssTokenKind.Hash, text: hash + readWhile(c, isNameChar) };
}

function readAt(c: Cursor): CssToken {
    const at = advance(c);
    return { kind: CssTokenKind.AtKeyword, text: at + readWhile(c, isNameChar) };
}

function readNumber(c: Cursor): CssToken {
    let text = "";
    if (peek(c, 0) === "+" || peek(c, 0) === "-") text += advance(c);
    text += readWhile(c, isDigit);
    if (peek(c, 0) === "." && isDigit(peek(c, 1))) text += advance(c) + readWhile(c, isDigit);
    if (peek(c, 0) === "%") return { kind: CssTokenKind.Percentage, text: text + advance(c) };
    if (isIdentStart(peek(c, 0))) return { kind: CssTokenKind.Dimension, text: text + readWhile(c, isNameChar) };
    return { kind: CssTokenKind.Number, text };
}

// A quoted url is left as an ident plus a normal string token, since the string already protects its contents.
function quotedUrlAhead(c: Cursor): boolean {
    let offset = 1;
    while (isWhitespace(peek(c, offset))) offset += 1;
    return peek(c, offset) === "\"" || peek(c, offset) === "'";
}

// `url(` with unquoted content is one token: its URL can hold `;`, `,` and `:` (a `data:` URI does), which the
// surrounding grammar would otherwise read as declaration and selector punctuation. Read to the closing `)`.
function readIdentOrUrl(c: Cursor): CssToken {
    const ident = readWhile(c, isNameChar);
    if (ident.toLowerCase() !== "url" || peek(c, 0) !== "(" || quotedUrlAhead(c)) return { kind: CssTokenKind.Ident, text: ident };
    let text = ident + advance(c);
    text += readWhile(c, isWhitespace);
    text += readUntil(c, ")");
    if (peek(c, 0) === ")") text += advance(c);
    return { kind: CssTokenKind.Url, text };
}

function startsNumber(c: Cursor): boolean {
    const lead = peek(c, 0);
    if (isDigit(lead)) return true;
    if (lead === "." && isDigit(peek(c, 1))) return true;
    if (lead !== "+" && lead !== "-") return false;
    return isDigit(peek(c, 1)) || (peek(c, 1) === "." && isDigit(peek(c, 2)));
}

export function nextToken(c: Cursor): CssToken {
    if (eof(c)) return { kind: CssTokenKind.Eof, text: "" };
    const lead = peek(c, 0);
    if (isWhitespace(lead)) return { kind: CssTokenKind.Whitespace, text: readWhile(c, isWhitespace) };
    if (lead === "/" && peek(c, 1) === "*") return readComment(c);
    if (lead === "\"" || lead === "'") return readString(c);
    if (lead === "{") return single(c, CssTokenKind.BraceOpen);
    if (lead === "}") return single(c, CssTokenKind.BraceClose);
    if (lead === "(") return single(c, CssTokenKind.ParenOpen);
    if (lead === ")") return single(c, CssTokenKind.ParenClose);
    if (lead === ":") return single(c, CssTokenKind.Colon);
    if (lead === ";") return single(c, CssTokenKind.Semicolon);
    if (lead === ",") return single(c, CssTokenKind.Comma);
    if (lead === "#") return readHash(c);
    if (lead === "@" && isIdentStart(peek(c, 1))) return readAt(c);
    if (startsNumber(c)) return readNumber(c);
    if (isIdentStart(lead)) return readIdentOrUrl(c);
    return single(c, CssTokenKind.Delim);
}
