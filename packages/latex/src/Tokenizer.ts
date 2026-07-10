import { OperatorChar } from "./Specification.js";
import { LatexError } from "./Support.js";

export enum PayloadKind {
    Number = "number",
    Letter = "letter",
    Command = "command",
    Operator = "operator"
}

export enum PunctKind {
    BraceOpen = "{",
    BraceClose = "}",
    Caret = "^",
    Underscore = "_",
    ParenOpen = "(",
    ParenClose = ")",
    BracketOpen = "[",
    BracketClose = "]"
}

export type TokenKind = PayloadKind | PunctKind;

export type Token =
    | { kind: PayloadKind.Number, value: number }
    | { kind: PayloadKind.Letter, name: string }
    | { kind: PayloadKind.Command, name: string }
    | { kind: PayloadKind.Operator, symbol: string }
    | { kind: PunctKind };

const PUNCT_CHARS = {
    [PunctKind.BraceOpen]: undefined,
    [PunctKind.BraceClose]: undefined,
    [PunctKind.Caret]: undefined,
    [PunctKind.Underscore]: undefined,
    [PunctKind.ParenOpen]: undefined,
    [PunctKind.ParenClose]: undefined,
    [PunctKind.BracketOpen]: undefined,
    [PunctKind.BracketClose]: undefined
} as const satisfies Record<PunctKind, void>;

function isPunctChar(char: string): char is PunctKind {
    return char in PUNCT_CHARS;
}

const OPERATOR_CHARS = {
    [OperatorChar.Plus]: undefined,
    [OperatorChar.Minus]: undefined,
    [OperatorChar.Equal]: undefined,
    [OperatorChar.Less]: undefined,
    [OperatorChar.Greater]: undefined,
    [OperatorChar.Slash]: undefined
} as const satisfies Record<OperatorChar, void>;

function isWhitespace(char: string): boolean {
    return char === " " || char === "\n" || char === "\t" || char === "\r";
}

function isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
}

function isAlpha(char: string): boolean {
    if (char >= "a" && char <= "z") return true;
    return char >= "A" && char <= "Z";
}

function readNumber(source: string, start: number): { value: number, next: number } {
    let index = start;
    while (index < source.length && isDigit(source[index])) index += 1;
    if (source[index] === "." && index + 1 < source.length && isDigit(source[index + 1])) {
        index += 1;
        while (index < source.length && isDigit(source[index])) index += 1;
    }
    return { value: Number(source.slice(start, index)), next: index };
}

// A backslash begins no other token, so an empty command name is a hard error, not a silently dropped character.
function readCommand(source: string, start: number): { name: string, next: number } {
    let index = start + 1;
    while (index < source.length && isAlpha(source[index])) index += 1;
    if (index === start + 1) throw new LatexError("expected a command name after '\\'", start);
    return { name: source.slice(start + 1, index), next: index };
}

/**
 * @throws {LatexError} when a character begins no valid token, or a backslash has no command name.
 */
export function tokenize(source: string): Array<Token> {
    const tokens: Array<Token> = [];
    let index = 0;
    while (index < source.length) {
        const char = source[index];
        if (isWhitespace(char)) {
            index += 1;
            continue;
        }
        if (isDigit(char)) {
            const { value, next } = readNumber(source, index);
            tokens.push({ kind: PayloadKind.Number, value });
            index = next;
            continue;
        }
        if (isAlpha(char)) {
            tokens.push({ kind: PayloadKind.Letter, name: char });
            index += 1;
            continue;
        }
        if (char === "\\") {
            const { name, next } = readCommand(source, index);
            tokens.push({ kind: PayloadKind.Command, name });
            index = next;
            continue;
        }
        if (char in OPERATOR_CHARS) {
            tokens.push({ kind: PayloadKind.Operator, symbol: char });
            index += 1;
            continue;
        }
        if (isPunctChar(char)) {
            tokens.push({ kind: char });
            index += 1;
            continue;
        }
        throw new LatexError(`unexpected character '${char}'`, index);
    }
    return tokens;
}
