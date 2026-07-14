import { BinaryOperator, UnaryOperator } from "./Specification.js";
import { MathError } from "./Support.js";
import { bySpelling, isAsciiLetter, isDigit, isWhitespace, memberGuard, readNumber } from "@dropdeck/common";
import type { Operator, Token } from "./typings/tokens.js";

export enum PayloadKind {
    Number = "number",
    Name = "name",
    Operator = "operator"
}

export enum PunctKind {
    Open = "(",
    Close = ")",
    Comma = ","
}

const operatorSpellings: ReadonlyArray<Operator> = (Object.values(BinaryOperator) as ReadonlyArray<Operator>).concat(Object.values(UnaryOperator));
const OPERATOR_BY_SPELLING = bySpelling(operatorSpellings);

// The widest symbol operator (word operators like `and` are read as names), so `operatorAt` needs no hardcoded
// width list -- adding a longer symbol operator lengthens the longest-match scan on its own.
const OPERATOR_WIDTH_MAX = Object.keys(OPERATOR_BY_SPELLING).reduce((width, spelling) => {
    if (isAsciiLetter(spelling[0])) return width;
    return Math.max(width, spelling.length);
}, 1);

const isPunctChar = memberGuard<PunctKind>(Object.values(PunctKind));

// A name may carry `_` (e.g. `x_i`), which a plain ASCII letter check excludes.
function isNameChar(char: string): boolean {
    return isAsciiLetter(char) || char === "_";
}

function readName(source: string, start: number): { name: string, next: number } {
    let index = start;
    while (index < source.length && (isNameChar(source[index]) || isDigit(source[index]))) index += 1;
    return { name: source.slice(start, index), next: index };
}

// The longest symbol operator starting at `start`, or null. Widest first so `===` beats `==` and `~==` beats `~=`.
function operatorAt(source: string, start: number): { operator: Operator, width: number } | null {
    for (let width = OPERATOR_WIDTH_MAX; width >= 1; width -= 1) {
        const operator = OPERATOR_BY_SPELLING[source.slice(start, start + width)];
        if (operator !== undefined) return { operator, width };
    }
    return null;
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
        if (isDigit(char)) {
            const { value, next } = readNumber(source, index);
            tokens.push({ kind: PayloadKind.Number, value });
            index = next;
            continue;
        }
        if (isNameChar(char)) {
            const { name, next } = readName(source, index);
            const wordOperator = OPERATOR_BY_SPELLING[name];
            tokens.push(wordOperator !== undefined ? { kind: PayloadKind.Operator, operator: wordOperator } : { kind: PayloadKind.Name, name });
            index = next;
            continue;
        }
        if (isPunctChar(char)) {
            tokens.push({ kind: char });
            index += 1;
            continue;
        }
        const match = operatorAt(source, index);
        if (match !== null) {
            tokens.push({ kind: PayloadKind.Operator, operator: match.operator });
            index += match.width;
            continue;
        }
        throw new MathError(`unexpected character '${char}'`, index);
    }
    return tokens;
}
