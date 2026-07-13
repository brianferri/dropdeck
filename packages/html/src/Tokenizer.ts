import { isAttributeNameChar, isTagNameChar, isUnquotedValueChar, isWhitespace } from "./Characters.js";
import { decodeEntities } from "./Entities.js";
import { advance, consume, eof, peek, readUntil, readWhile, skipWhile, startsWith, startsWithInsensitive } from "./scan/Cursor.js";
import type { Cursor } from "./typings/scan.js";
import type { Attr, AttrList } from "./typings/nodes.js";
import type { Token } from "./typings/tokens.js";

export enum TokenKind {
    StartTag = "startTag",
    EndTag = "endTag",
    Text = "text",
    Comment = "comment",
    Eof = "eof"
}

function readComment(c: Cursor): Token {
    consume(c, "<!--");
    readUntil(c, "-->");
    consume(c, "-->");
    return { kind: TokenKind.Comment };
}

function readBogus(c: Cursor): Token {
    readUntil(c, ">");
    consume(c, ">");
    return { kind: TokenKind.Comment };
}

function readEndTag(c: Cursor): Token {
    consume(c, "</");
    const name = readWhile(c, isTagNameChar);
    readUntil(c, ">");
    consume(c, ">");
    return { kind: TokenKind.EndTag, name };
}

function readAttributeValue(c: Cursor): string {
    const quote = peek(c, 0);
    if (quote === "\"" || quote === "'") {
        advance(c);
        const value = readUntil(c, quote);
        consume(c, quote);
        return decodeEntities(value);
    }
    return decodeEntities(readWhile(c, isUnquotedValueChar));
}

// Returns null when no name is present so the caller advances past the offending character rather than spinning.
function readAttribute(c: Cursor): Attr | null {
    const name = readWhile(c, isAttributeNameChar);
    if (name === "") return null;
    skipWhile(c, isWhitespace);
    if (!consume(c, "=")) return [name, ""];
    skipWhile(c, isWhitespace);
    return [name, readAttributeValue(c)];
}

function readAttributes(c: Cursor): AttrList {
    const attrs: Array<Attr> = [];
    while (!eof(c)) {
        skipWhile(c, isWhitespace);
        const lead = peek(c, 0);
        if (lead === ">" || lead === "/" || lead === "") break;
        const attr = readAttribute(c);
        if (attr === null) advance(c);
        else attrs.push(attr);
    }
    return attrs;
}

function readStartTag(c: Cursor): Token {
    advance(c);
    const name = readWhile(c, isTagNameChar);
    const attrs = readAttributes(c);
    const selfClosing = consume(c, "/");
    readUntil(c, ">");
    consume(c, ">");
    return { kind: TokenKind.StartTag, name, attrs, selfClosing };
}

function readMarkup(c: Cursor): Token {
    if (startsWith(c, "<!--")) return readComment(c);
    if (startsWith(c, "<!") || startsWith(c, "<?")) return readBogus(c);
    const lead = peek(c, 1);
    if (lead === "/") return readEndTag(c);
    if (isTagNameChar(lead)) return readStartTag(c);
    advance(c);
    return { kind: TokenKind.Text, value: "<" };
}

// Raw-text content is pulled separately by `readRawText` since only the tree builder knows whether the open element suppresses markup.
export function nextToken(c: Cursor): Token {
    if (eof(c)) return { kind: TokenKind.Eof };
    if (peek(c, 0) !== "<") return { kind: TokenKind.Text, value: decodeEntities(readUntil(c, "<")) };
    return readMarkup(c);
}

// A `<` inside the content (a comparison in a script, an angle bracket in a code sample) is taken as a literal character; only the matching close tag ends the run.
export function readRawText(c: Cursor, name: string): string {
    const close = `</${name}`;
    let out = "";
    while (!eof(c)) {
        out += readUntil(c, "<");
        if (eof(c)) break;
        if (startsWithInsensitive(c, close)) {
            readUntil(c, ">");
            consume(c, ">");
            return out;
        }
        out += advance(c);
    }
    return out;
}
