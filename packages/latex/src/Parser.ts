import { fenced, fraction, identifier, number, operator, radical, root, row, subscript, superscript } from "./builders.js";
import { PayloadKind, PunctKind, tokenize } from "./Tokenizer.js";
import { LatexError } from "./Support.js";
import { LatexOperatorCommand } from "./Specification.js";
import type { Token } from "./Tokenizer.js";
import type { Notation } from "./Specification.js";
import type { Parse } from "./Parse.js";

type Cursor = { tokens: ReadonlyArray<Token>, index: number };

const OPERATOR_COMMANDS = {
    [LatexOperatorCommand.Cdot]: undefined,
    [LatexOperatorCommand.Times]: undefined,
    [LatexOperatorCommand.Div]: undefined,
    [LatexOperatorCommand.Pm]: undefined,
    [LatexOperatorCommand.Mp]: undefined,
    [LatexOperatorCommand.Le]: undefined,
    [LatexOperatorCommand.Ge]: undefined,
    [LatexOperatorCommand.Ne]: undefined,
    [LatexOperatorCommand.Leq]: undefined,
    [LatexOperatorCommand.Geq]: undefined,
    [LatexOperatorCommand.Neq]: undefined,
    [LatexOperatorCommand.Approx]: undefined,
    [LatexOperatorCommand.Equiv]: undefined,
    [LatexOperatorCommand.Land]: undefined,
    [LatexOperatorCommand.Lor]: undefined,
    [LatexOperatorCommand.To]: undefined,
    [LatexOperatorCommand.Mapsto]: undefined,
    [LatexOperatorCommand.In]: undefined,
    [LatexOperatorCommand.Cup]: undefined,
    [LatexOperatorCommand.Cap]: undefined
} as const satisfies Record<LatexOperatorCommand, void>;

function isOperatorCommand(name: string): name is keyof typeof OPERATOR_COMMANDS {
    return name in OPERATOR_COMMANDS;
}

function peek(cursor: Cursor): Token | undefined {
    return cursor.tokens[cursor.index];
}

function peekKind(cursor: Cursor, kind: PunctKind): boolean {
    return peek(cursor)?.kind === kind;
}

function isTerminator(cursor: Cursor): boolean {
    const token = peek(cursor);
    if (token === undefined) return true;
    switch (token.kind) {
        case PunctKind.BraceClose:
        case PunctKind.ParenClose:
        case PunctKind.BracketClose:
            return true;
        case PayloadKind.Number:
        case PayloadKind.Letter:
        case PayloadKind.Command:
        case PayloadKind.Operator:
        case PunctKind.BraceOpen:
        case PunctKind.Caret:
        case PunctKind.Underscore:
        case PunctKind.ParenOpen:
        case PunctKind.BracketOpen:
            return false;
    }
}

function expect(cursor: Cursor, kind: PunctKind, close: string): void {
    if (!peekKind(cursor, kind)) throw new LatexError(`expected '${close}'`, cursor.index);
    cursor.index += 1;
}

function parseFraction(cursor: Cursor): Notation {
    const numerator = parseBase(cursor);
    return fraction(numerator, parseBase(cursor));
}

function parseRoot(cursor: Cursor): Notation {
    if (!peekKind(cursor, PunctKind.BracketOpen)) return radical(parseBase(cursor));
    cursor.index += 1;
    const index = parseRow(cursor);
    expect(cursor, PunctKind.BracketClose, "]");
    return root(parseBase(cursor), index);
}

function parseCommand(cursor: Cursor, name: string): Notation {
    if (name === "frac") return parseFraction(cursor);
    if (name === "sqrt") return parseRoot(cursor);
    if (isOperatorCommand(name)) return operator(`\\${name}`);
    return identifier(`\\${name}`);
}

function parseBase(cursor: Cursor): Notation {
    const token = peek(cursor);
    if (token === undefined) throw new LatexError("unexpected end of input", cursor.index);
    switch (token.kind) {
        case PayloadKind.Number:
            cursor.index += 1;
            return number(token.value);
        case PayloadKind.Letter:
            cursor.index += 1;
            return identifier(token.name);
        case PayloadKind.Operator:
            cursor.index += 1;
            return operator(token.symbol);
        case PayloadKind.Command:
            cursor.index += 1;
            return parseCommand(cursor, token.name);
        case PunctKind.BraceOpen: {
            cursor.index += 1;
            const inner = parseRow(cursor);
            expect(cursor, PunctKind.BraceClose, "}");
            return inner;
        }
        case PunctKind.ParenOpen: return parseFence(cursor, "(", ")", PunctKind.ParenClose);
        case PunctKind.BracketOpen: return parseFence(cursor, "[", "]", PunctKind.BracketClose);
        case PunctKind.BraceClose:
        case PunctKind.Caret:
        case PunctKind.Underscore:
        case PunctKind.ParenClose:
        case PunctKind.BracketClose:
            throw new LatexError("expected an expression", cursor.index);
    }
}

function parseFence(cursor: Cursor, open: string, close: string, closeKind: PunctKind): Notation {
    cursor.index += 1;
    const inner = parseRow(cursor);
    expect(cursor, closeKind, close);
    return fenced(open, close, [inner]);
}

function parseScripted(cursor: Cursor): Notation {
    let base = parseBase(cursor);
    let scripted = true;
    while (scripted) {
        if (peekKind(cursor, PunctKind.Caret)) {
            cursor.index += 1;
            base = superscript(base, parseBase(cursor));
        } else if (peekKind(cursor, PunctKind.Underscore)) {
            cursor.index += 1;
            base = subscript(base, parseBase(cursor));
        } else
            scripted = false;
    }
    return base;
}

// A lone element is returned unwrapped, so `{x}` and `x` collapse to the same node.
function parseRow(cursor: Cursor): Notation {
    const nodes: Array<Notation> = [];
    while (!isTerminator(cursor)) nodes.push(parseScripted(cursor));
    const [only] = nodes;
    if (nodes.length === 1) return only;
    return row(nodes);
}

/**
 * Parse LaTeX math source into its presentational IR tree.
 *
 * @throws {LatexError} when the source has an unexpected character, an incomplete construct, or trailing input.
 */
export function parse<const Source extends string>(source: Source): Parse<Source> {
    const cursor: Cursor = { tokens: tokenize(source), index: 0 };
    const node = parseRow(cursor);
    if (cursor.index !== cursor.tokens.length) throw new LatexError("unexpected trailing input", cursor.index);
    return node as Parse<Source>;
}
