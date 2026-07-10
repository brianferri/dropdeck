import { BinaryOperator, UnaryOperator } from "./Specification.js";
import { MathError } from "./Support.js";

export enum TokenKind {
    Number = "number",
    Name = "name",
    Operator = "operator",
    Open = "(",
    Close = ")",
    Comma = ","
}

export type Operator = BinaryOperator | UnaryOperator;

export type Token =
    | { kind: TokenKind.Number, value: number }
    | { kind: TokenKind.Name, name: string }
    | { kind: TokenKind.Operator, operator: Operator }
    | { kind: TokenKind.Open }
    | { kind: TokenKind.Close }
    | { kind: TokenKind.Comma };

const OPERATOR_BY_SPELLING: Record<string, Operator | undefined> = {};
for (const operator of Object.values(BinaryOperator)) OPERATOR_BY_SPELLING[operator] = operator;
for (const operator of Object.values(UnaryOperator)) OPERATOR_BY_SPELLING[operator] = operator;

type PunctKind = TokenKind.Open | TokenKind.Close | TokenKind.Comma;
const PUNCT_BY_SPELLING: Record<string, PunctKind | undefined> = {
    [TokenKind.Open]: TokenKind.Open,
    [TokenKind.Close]: TokenKind.Close,
    [TokenKind.Comma]: TokenKind.Comma
};

function isWhitespace(char: string): boolean {
    return char === " " || char === "\n" || char === "\t" || char === "\r";
}

function isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
}

function isAlpha(char: string): boolean {
    if (char >= "a" && char <= "z") return true;
    if (char >= "A" && char <= "Z") return true;
    return char === "_";
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

function readName(source: string, start: number): { name: string, next: number } {
    let index = start;
    while (index < source.length && isAlpha(source[index])) index += 1;
    return { name: source.slice(start, index), next: index };
}

/**
 * @throws {MathError} when a character begins no valid token.
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
        const pairOperator = OPERATOR_BY_SPELLING[source.slice(index, index + 2)];
        if (pairOperator !== undefined) {
            tokens.push({ kind: TokenKind.Operator, operator: pairOperator });
            index += 2;
            continue;
        }
        if (isDigit(char)) {
            const { value, next } = readNumber(source, index);
            tokens.push({ kind: TokenKind.Number, value });
            index = next;
            continue;
        }
        if (isAlpha(char)) {
            const { name, next } = readName(source, index);
            const wordOperator = OPERATOR_BY_SPELLING[name];
            tokens.push(wordOperator !== undefined ? { kind: TokenKind.Operator, operator: wordOperator } : { kind: TokenKind.Name, name });
            index = next;
            continue;
        }
        const punctKind = PUNCT_BY_SPELLING[char];
        if (punctKind !== undefined) {
            tokens.push({ kind: punctKind });
            index += 1;
            continue;
        }
        const charOperator = OPERATOR_BY_SPELLING[char];
        if (charOperator !== undefined) {
            tokens.push({ kind: TokenKind.Operator, operator: charOperator });
            index += 1;
            continue;
        }
        throw new MathError(`unexpected character '${char}'`, index);
    }
    return tokens;
}
