import { binary, call, constant, logicalNot, negate, number, variable } from "./builders.js";
import { TokenKind, tokenize } from "./Tokenizer.js";
import { BinaryOperator, MathConstant, OPERATOR_PRECEDENCE, UnaryOperator } from "./Specification.js";
import { MathError } from "./Support.js";
import type { Operator, Token } from "./Tokenizer.js";
import type { Expression } from "./Specification.js";
import type { Parse } from "./Parse.js";

type Cursor = { tokens: ReadonlyArray<Token>, index: number };
type PunctKind = TokenKind.Open | TokenKind.Close | TokenKind.Comma;

const MATH_CONSTANTS: Record<MathConstant, true> = {
    [MathConstant.Pi]: true,
    [MathConstant.E]: true,
    [MathConstant.Tau]: true
};

function isBinaryOperator(operator: Operator): operator is BinaryOperator {
    return operator in OPERATOR_PRECEDENCE;
}

function isConstant(name: string): name is MathConstant {
    return name in MATH_CONSTANTS;
}

function peek(cursor: Cursor): Token | undefined {
    return cursor.tokens[cursor.index];
}

function peekOperator(cursor: Cursor, operator: Operator): boolean {
    const token = peek(cursor);
    return token?.kind === TokenKind.Operator && token.operator === operator;
}

function peekPunct(cursor: Cursor, kind: PunctKind): boolean {
    return peek(cursor)?.kind === kind;
}

function expectClose(cursor: Cursor): void {
    if (!peekPunct(cursor, TokenKind.Close)) throw new MathError("expected ')'", cursor.index);
    cursor.index += 1;
}

function parseArguments(cursor: Cursor): Array<Expression> {
    const args: Array<Expression> = [];
    if (peekPunct(cursor, TokenKind.Close)) {
        cursor.index += 1;
        return args;
    }
    args.push(parseExpression(cursor));
    while (peekPunct(cursor, TokenKind.Comma)) {
        cursor.index += 1;
        args.push(parseExpression(cursor));
    }
    expectClose(cursor);
    return args;
}

function parsePrimary(cursor: Cursor): Expression {
    const token = peek(cursor);
    if (token === undefined) throw new MathError("unexpected end of input", cursor.index);
    if (token.kind === TokenKind.Number) {
        cursor.index += 1;
        return number(token.value);
    }
    if (token.kind === TokenKind.Name) {
        cursor.index += 1;
        if (peekPunct(cursor, TokenKind.Open)) {
            cursor.index += 1;
            return call(token.name, parseArguments(cursor));
        }
        return isConstant(token.name) ? constant(token.name) : variable(token.name);
    }
    if (token.kind === TokenKind.Open) {
        cursor.index += 1;
        const node = parseExpression(cursor);
        expectClose(cursor);
        return node;
    }
    throw new MathError("expected an expression", cursor.index);
}

function parseUnary(cursor: Cursor): Expression {
    if (peekOperator(cursor, BinaryOperator.Subtract)) {
        cursor.index += 1;
        return negate(parseUnary(cursor));
    }
    if (peekOperator(cursor, UnaryOperator.Not)) {
        cursor.index += 1;
        return logicalNot(parseUnary(cursor));
    }
    return parsePrimary(cursor);
}

function parsePower(cursor: Cursor): Expression {
    const left = parseUnary(cursor);
    if (peekOperator(cursor, BinaryOperator.Power)) {
        cursor.index += 1;
        return binary(BinaryOperator.Power, left, parsePower(cursor));
    }
    return left;
}

function parseBinaryAt(cursor: Cursor, precedence: number): Expression {
    if (precedence >= OPERATOR_PRECEDENCE[BinaryOperator.Power]) return parsePower(cursor);
    let left = parseBinaryAt(cursor, precedence + 1);
    let token = peek(cursor);
    while (token?.kind === TokenKind.Operator && isBinaryOperator(token.operator) && OPERATOR_PRECEDENCE[token.operator] === precedence) {
        cursor.index += 1;
        left = binary(token.operator, left, parseBinaryAt(cursor, precedence + 1));
        token = peek(cursor);
    }
    return left;
}

function parseExpression(cursor: Cursor): Expression {
    return parseBinaryAt(cursor, 1);
}

/**
 * Parse math source into its IR tree
 *
 * @throws {MathError} when the source has an unexpected character, an incomplete expression, or trailing input.
 */
export function parse<const Source extends string>(source: Source): Parse<Source> {
    const cursor: Cursor = { tokens: tokenize(source), index: 0 };
    const node = parseExpression(cursor);
    if (cursor.index !== cursor.tokens.length) throw new MathError("unexpected trailing input", cursor.index);
    return node as Parse<Source>;
}
