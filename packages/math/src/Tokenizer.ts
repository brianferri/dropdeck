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
            tokens.push({ kind: PayloadKind.Operator, operator: pairOperator });
            index += 2;
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
        const charOperator = OPERATOR_BY_SPELLING[char];
        if (charOperator !== undefined) {
            tokens.push({ kind: PayloadKind.Operator, operator: charOperator });
            index += 1;
            continue;
        }
        throw new MathError(`unexpected character '${char}'`, index);
    }
    return tokens;
}
