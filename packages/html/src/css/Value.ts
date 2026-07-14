import { CssTokenKind, nextToken } from "./Tokenizer.js";
import { cursor } from "../scan/Cursor.js";
import { CssValueKind } from "./Specification.js";
import type { CssToken } from "./Tokenizer.js";
import type { DigitChar as Digit, TakeRun, TakeThrough, TakeUntil, TrimStart, Whitespace as Ws } from "@dropdeck/common";
import type {
    Block, ComponentValue, ComponentValues, Delimiter, Dimension, FunctionValue,
    Hash, Keyword, NumberValue, Percentage, Separator, StringValue
} from "./Specification.js";

type Close<Open extends string> = Open extends "(" ? ")" : Open extends "[" ? "]" : "}";

type SerializeOne<V extends ComponentValue> =
    | (V extends Keyword<infer Name> ? Name : never)
    | (V extends NumberValue<infer Text> ? Text : never)
    | (V extends Dimension<infer Value, infer Unit> ? `${Value}${Unit}` : never)
    | (V extends Percentage<infer Value> ? `${Value}%` : never)
    | (V extends StringValue<infer Text> ? Text : never)
    | (V extends Hash<infer Text> ? Text : never)
    | (V extends Delimiter<infer Char> ? Char : never)
    | (V extends Separator<infer Char> ? Char : never)
    | (V extends FunctionValue<infer Name, infer Values> ? `${Name}(${SerializeSequence<Values>})` : never)
    | (V extends Block<infer Open, infer Values> ? `${Open}${SerializeSequence<Values>}${Close<Open>}` : never);

type SerializeSequence<T extends ComponentValues> =
    T extends readonly [infer Head extends ComponentValue, ...infer Rest extends ComponentValues]
        ? `${SerializeOne<Head>}${SerializeSequence<Rest>}` : "";

export type SerializeValue<T extends ComponentValues> = SerializeSequence<T>;

type Sign = "+" | "-";
type Quote = "\"" | "'";
type OpenChar = "(" | "[" | "{";
type CloseChar = ")" | "]" | "}";
type NumChar = Digit | Sign | ".";
/** A keyword or unit run ends at the first character a value grammar keys on (space, bracket, comma, percent, quote). */
type Stop = Ws | OpenChar | CloseChar | "," | "%" | Quote;

type ParseNumber<S extends string, Out extends ComponentValues> =
    TakeRun<S, NumChar> extends { run: infer Num extends string, rest: infer Rest extends string }
        ? Rest extends `%${infer AfterPercent}` ? ParseList<AfterPercent, readonly [...Out, Percentage<Num>]>
            : TakeUntil<Rest, Stop> extends { run: infer Unit extends string, rest: infer AfterUnit extends string }
                ? Unit extends "" ? ParseList<Rest, readonly [...Out, NumberValue<Num>]>
                    : ParseList<AfterUnit, readonly [...Out, Dimension<Num, Unit>]>
                : never
        : never;

type ParseFunction<Name extends string, Inner extends string, Out extends ComponentValues> =
    ParseList<Inner> extends [infer Value extends ComponentValues, infer Rest extends string]
        ? Rest extends `)${infer After}`
            ? ParseList<After, readonly [...Out, FunctionValue<Name, Value>]>
            : ParseList<Rest, readonly [...Out, FunctionValue<Name, Value>]>
        : never;

type ParseBlock<Open extends OpenChar, Rest extends string, Out extends ComponentValues> =
    ParseList<Rest> extends [infer Value extends ComponentValues, infer After extends string]
        ? After extends `${Close<Open>}${infer AfterClose}`
            ? ParseList<AfterClose, readonly [...Out, Block<Open, Value>]>
            : ParseList<After, readonly [...Out, Block<Open, Value>]>
        : never;

type ParseIdent<Char extends string, Rest extends string, S extends string, Out extends ComponentValues> =
    TakeUntil<S, Stop> extends { run: infer Name extends string, rest: infer After extends string }
        ? Name extends ""
            ? ParseList<Rest, readonly [...Out, Delimiter<Char>]>
            : After extends `(${infer Inner}`
                ? ParseFunction<Name, Inner, Out>
                : ParseList<After, readonly [...Out, Keyword<Name>]>
        : never;

type ParseHash<Rest extends string, Out extends ComponentValues> =
    TakeUntil<Rest, Stop> extends { run: infer Name extends string, rest: infer After extends string }
        ? ParseList<After, readonly [...Out, Hash<`#${Name}`>]>
        : never;

type ParseString<Char extends string, Rest extends string, Out extends ComponentValues> =
    TakeThrough<Rest, Char> extends { run: infer Body extends string, rest: infer After extends string }
        ? ParseList<After, readonly [...Out, StringValue<`${Char}${Body}${Char}`>]>
        : never;

/** A sign opens a number only when a digit or dot follows; otherwise it begins an identifier (`--custom`, `-webkit`). */
type ParseSigned<Char extends string, Rest extends string, S extends string, Out extends ComponentValues> =
    Rest extends `${Digit | "."}${string}` ? ParseNumber<S, Out> : ParseIdent<Char, Rest, S, Out>;

/** The leading characters the explicit arms below consume; anything else opens a keyword or a lone delimiter. */
type Structural = CloseChar | Ws | "," | OpenChar | "#" | Quote | Digit | "." | Sign;

/**
 * Each arm guards on the leading character and is `never` unless it matches, so exactly one contributes and the
 * union collapses to it.
 */
type ParseList<S extends string, Out extends ComponentValues = readonly []> =
    S extends `${infer Char}${infer Rest}`
        ?
            | (Char extends CloseChar ? [Out, S] : never)
            | (Char extends Ws ? ParseList<TrimStart<Rest>, readonly [...Out, Separator<" ">]> : never)
            | (Char extends "," ? ParseList<Rest, readonly [...Out, Separator<",">]> : never)
            | (Char extends OpenChar ? ParseBlock<Char, Rest, Out> : never)
            | (Char extends "#" ? ParseHash<Rest, Out> : never)
            | (Char extends Quote ? ParseString<Char, Rest, Out> : never)
            | (Char extends Digit | "." ? ParseNumber<S, Out> : never)
            | (Char extends Sign ? ParseSigned<Char, Rest, S, Out> : never)
            | (Char extends Structural ? never : ParseIdent<Char, Rest, S, Out>)
        : [Out, S];

/** A non-literal `string` widens to the general list, mirroring `ParseStylesheet`; a literal resolves to its tree. */
export type ParseValue<S extends string> =
    string extends S ? ComponentValues
        : ParseList<S> extends [infer Out extends ComponentValues, string] ? Out : never;

function tokenize(source: string): Array<CssToken> {
    const scanner = cursor(source);
    const tokens: Array<CssToken> = [];
    let token = nextToken(scanner);
    while (token.kind !== CssTokenKind.Eof) {
        tokens.push(token);
        token = nextToken(scanner);
    }
    return tokens;
}

/**
 * A dimension token is a number glued to a unit (`300px`, `14deg`); split at the first non-numeric character so a
 * consumer reads the unit without re-lexing. Exponent syntax (`1e3px`) is rare enough to leave in the value part.
 */
function splitDimension(text: string): { value: string, unit: string } {
    let index = 0;
    while (index < text.length && "+-.0123456789".includes(text[index])) index += 1;
    return { value: text.slice(0, index), unit: text.slice(index) };
}

function leaf(token: CssToken): ComponentValue | null {
    if (token.kind === CssTokenKind.Ident) return { kind: CssValueKind.Keyword, name: token.text };
    if (token.kind === CssTokenKind.Url) return { kind: CssValueKind.Keyword, name: token.text };
    if (token.kind === CssTokenKind.Number) return { kind: CssValueKind.Number, text: token.text };
    if (token.kind === CssTokenKind.Dimension) {
        const parts = splitDimension(token.text);
        return { kind: CssValueKind.Dimension, value: parts.value, unit: parts.unit };
    }
    if (token.kind === CssTokenKind.Percentage) return { kind: CssValueKind.Percentage, value: token.text.slice(0, -1) };
    if (token.kind === CssTokenKind.Str) return { kind: CssValueKind.Str, text: token.text };
    if (token.kind === CssTokenKind.Hash) return { kind: CssValueKind.Hash, text: token.text };
    if (token.kind === CssTokenKind.Comma) return { kind: CssValueKind.Separator, char: "," };
    if (token.kind === CssTokenKind.Whitespace) return { kind: CssValueKind.Separator, char: " " };
    if (token.kind === CssTokenKind.Delim) return { kind: CssValueKind.Delimiter, char: token.text };
    return null;
}

type Frame = { name: string | null, values: Array<ComponentValue> };

function close(stack: Array<Frame>): void {
    const frame = stack.pop();
    if (frame === undefined) return;
    const parent = stack[stack.length - 1];
    if (frame.name === null) parent.values.push({ kind: CssValueKind.Block, open: "(", value: frame.values });
    else parent.values.push({ kind: CssValueKind.Function, name: frame.name, value: frame.values });
}

export function parseValue<const S extends string>(source: S): ParseValue<S> {
    const tokens = tokenize(source);
    const stack: Array<Frame> = [ { name: null, values: [] } ];
    let index = 0;
    while (index < tokens.length) {
        const token = tokens[index];
        const isFunction = token.kind === CssTokenKind.Ident && tokens[index + 1]?.kind === CssTokenKind.ParenOpen;
        if (isFunction) {
            stack.push({ name: token.text, values: [] });
            index += 2;
            continue;
        }
        if (token.kind === CssTokenKind.ParenOpen) {
            stack.push({ name: null, values: [] });
            index += 1;
            continue;
        }
        if (token.kind === CssTokenKind.ParenClose) {
            if (stack.length > 1) close(stack);
            index += 1;
            continue;
        }
        const value = leaf(token);
        if (value !== null) stack[stack.length - 1].values.push(value);
        index += 1;
    }
    // An unclosed function/block still yields its captured children rather than being dropped.
    while (stack.length > 1) close(stack);
    const values: ComponentValues = stack[0].values;
    return values as ParseValue<S>;
}

function renderOne(value: ComponentValue): string {
    switch (value.kind) {
        case CssValueKind.Keyword: return value.name;
        case CssValueKind.Number: return value.text;
        case CssValueKind.Dimension: return `${value.value}${value.unit}`;
        case CssValueKind.Percentage: return `${value.value}%`;
        case CssValueKind.Str: return value.text;
        case CssValueKind.Hash: return value.text;
        case CssValueKind.Delimiter: return value.char;
        case CssValueKind.Separator: return value.char;
        case CssValueKind.Function: return `${value.name}(${render(value.value)})`;
        case CssValueKind.Block: return `${value.open}${render(value.value)}${value.open === "(" ? ")" : value.open === "[" ? "]" : "}"}`;
    }
}

function render(values: ComponentValues): string {
    let out = "";
    for (const value of values) out += renderOne(value);
    return out;
}

export function serializeValue<const T extends ComponentValues>(values: T): SerializeValue<T> {
    return render(values) as SerializeValue<T>;
}
