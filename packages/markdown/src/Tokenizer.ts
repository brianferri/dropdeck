import { ATX_LEVEL_MAX } from "./Specification.js";

// The highlighting IR: a flat, gap-free stream of positioned tokens over the source. Every character lands in
// exactly one token, so a consumer rebuilds the source by slicing `[start, end)` in order. Kinds are the
// CommonMark block constructs a highlighter colours; the rest is `Text` (the editor recognises its own
// `::directive::` extension, which CommonMark cannot represent, when it reads a Text token).
export enum TokenKind {
    Text = "text",
    Separator = "separator",
    Heading = "heading",
    Fence = "fence",
    Quote = "quote",
    List = "list"
}

export type Token = {
    readonly kind: TokenKind,
    readonly start: number,
    readonly end: number
};

function isThematicBreak(line: string): boolean {
    return line.startsWith("---") && Array.from(line).every((ch) => ch === "-");
}

function headingLevel(line: string): number {
    const firstOther = Array.from(line).findIndex((ch) => ch !== "#");
    const level = firstOther < 0 ? line.length : firstOther;
    return level >= 1 && level <= ATX_LEVEL_MAX && line[level] === " " ? level : 0;
}

function listMarkerLength(line: string): number {
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("+ ")) return 2;
    const firstOther = Array.from(line).findIndex((ch) => ch < "0" || ch > "9");
    const digits = firstOther < 0 ? line.length : firstOther;
    return digits > 0 && line.startsWith(". ", digits) ? digits + 2 : 0;
}

function classifyLine(source: string, start: number, end: number): ReadonlyArray<Token> {
    const line = source.slice(start, end);
    if (isThematicBreak(line)) return [ { kind: TokenKind.Separator, start, end } ];
    if (headingLevel(line) > 0) return [ { kind: TokenKind.Heading, start, end } ];
    if (line.startsWith("```")) return [ { kind: TokenKind.Fence, start, end } ];
    if (line.startsWith(">")) return [ { kind: TokenKind.Quote, start, end } ];
    const marker = listMarkerLength(line);
    return marker === 0
        ? [ { kind: TokenKind.Text, start, end } ]
        : [ { kind: TokenKind.List, start, end: start + marker }, { kind: TokenKind.Text, start: start + marker, end } ];
}

export function tokenize(source: string): ReadonlyArray<Token> {
    const tokens: Array<Token> = [];
    // `start` advances past at least the current line plus its newline each turn, so it is strictly increasing
    // and bounded by the source length -- the line scan cannot loop. A recursive walk would instead stack one
    // frame per line and overflow on a large deck.
    let start = 0;
    while (start < source.length) {
        const newline = source.indexOf("\n", start);
        if (newline < 0) {
            for (const token of classifyLine(source, start, source.length)) tokens.push(token);
            return tokens;
        }
        for (const token of classifyLine(source, start, newline)) tokens.push(token);
        tokens.push({ kind: TokenKind.Text, start: newline, end: newline + 1 });
        start = newline + 1;
    }
    return tokens;
}
