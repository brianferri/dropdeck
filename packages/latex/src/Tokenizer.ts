import { OperatorChar } from "./Specification.js";
import { LatexError } from "./Support.js";
import type { Token } from "./typings/tokens.js";
import { isAsciiLetter, isDigit, isWhitespace, memberGuard, readNumber } from "@dropdeck/common";

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

const isPunctChar = memberGuard<PunctKind>(Object.values(PunctKind));
const isOperatorChar = memberGuard<OperatorChar>(Object.values(OperatorChar));

// A backslash begins no other token, so an empty command name is a hard error, not a silently dropped character.
function readCommand(source: string, start: number): { name: string, next: number } {
    let index = start + 1;
    while (index < source.length && isAsciiLetter(source[index])) index += 1;
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
        if (isAsciiLetter(char)) {
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
        if (isOperatorChar(char)) {
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
