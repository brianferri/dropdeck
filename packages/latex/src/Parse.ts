import type {
    Content, FencedNode, FractionNode, IdentifierNode, LatexOperatorCommand, Notation, NumberNode, One,
    OperatorChar, OperatorNode, Pair, RadicalNode, RowNode, SubscriptNode, SuperscriptNode
} from "./Specification.js";
import type { PayloadKind, PunctKind } from "./Tokenizer.js";

type NumberToken<Value extends number = number> = { kind: PayloadKind.Number, value: Value };
type LetterToken<Name extends string = string> = { kind: PayloadKind.Letter, name: Name };
type CommandToken<Name extends string = string> = { kind: PayloadKind.Command, name: Name };
type OperatorToken<Symbol extends string = string> = { kind: PayloadKind.Operator, symbol: Symbol };
type PunctToken<Kind extends PunctKind = PunctKind> = { kind: Kind };

type Token = NumberToken | LetterToken | CommandToken | OperatorToken | PunctToken;
type Tokens = ReadonlyArray<Token>;

type OperatorCommandName = `${LatexOperatorCommand}`;

type DigitChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type AlphaChar =
    | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
    | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
    | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
    | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type Whitespace = " " | "\n" | "\t" | "\r";

type PunctBySpelling = { [Kind in PunctKind as `${Kind}`]: Kind };
type OperatorCharSpelling = `${OperatorChar}`;

type TakeRun<Source extends string, Class extends string, Acc extends string = ""> =
    Source extends `${infer Head}${infer Rest}`
        ? Head extends Class ? TakeRun<Rest, Class, `${Acc}${Head}`> : { run: Acc, rest: Source }
        : { run: Acc, rest: Source };

type TakeNumber<Source extends string> =
    TakeRun<Source, DigitChar> extends { run: infer Integer extends string, rest: infer Rest extends string }
        ? Rest extends `.${infer Tail extends string}`
            ? TakeRun<Tail, DigitChar> extends { run: infer Fraction extends string, rest: infer After extends string }
                ? Fraction extends "" ? { run: Integer, rest: Rest } : { run: `${Integer}.${Fraction}`, rest: After }
                : never
            : { run: Integer, rest: Rest }
        : never;

type NumberOf<Run extends string> = Run extends `${infer Value extends number}` ? Value : never;

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

type Step<Produced extends Tokens, Rest extends string> = { produced: Produced, rest: Rest };

type SpaceRule<S extends string> = S extends `${Whitespace}${infer Rest}` ? Step<[], Rest> : false;
type NumberRule<S extends string> =
    S extends `${infer Head}${string}`
        ? Head extends DigitChar
            ? TakeNumber<S> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NumberToken<NumberOf<Run>>], Rest> : false
            : false
        : false;
type LetterRule<S extends string> =
    S extends `${infer Head}${infer Rest}` ? Head extends AlphaChar ? Step<[LetterToken<Head>], Rest> : false : false;
type CommandRule<S extends string> =
    S extends `\\${infer Tail}`
        ? TakeRun<Tail, AlphaChar> extends { run: infer Name extends string, rest: infer Rest extends string }
            ? Name extends "" ? false : Step<[CommandToken<Name>], Rest>
            : false
        : false;
type OperatorRule<S extends string> =
    S extends `${infer Head}${infer Rest}` ? Head extends OperatorCharSpelling ? Step<[OperatorToken<Head>], Rest> : false : false;
type PunctRule<S extends string> =
    S extends `${infer Head}${infer Rest}` ? Head extends keyof PunctBySpelling ? Step<[PunctToken<PunctBySpelling[Head]>], Rest> : false : false;

type NextToken<S extends string> = FirstMatch<readonly [
    SpaceRule<S>,
    NumberRule<S>,
    LetterRule<S>,
    CommandRule<S>,
    OperatorRule<S>,
    PunctRule<S>
]>;

type Tokenize<Source extends string, Acc extends Tokens = []> =
    Source extends "" ? Acc
        : NextToken<Source> extends Step<infer Produced, infer Rest>
            ? Tokenize<Rest, [...Acc, ...Produced]>
            : ParseError<`unexpected character in "${Source}"`>;

export type ParseError<Message extends string = string> = { parseError: Message };
type Parsed<Node extends Notation, Rest extends Tokens> = { node: Node, rest: Rest };

// A brace group is transparent -- it returns its inner notation, so `{a+b}` and `a+b` parse identically.
type ParseGroup<T extends Tokens> =
    ParseRow<T> extends infer Result
        ? Result extends Parsed<infer Inner, infer Rest>
            ? Rest extends [PunctToken<PunctKind.BraceClose>, ...infer After extends Tokens] ? Parsed<Inner, After> : ParseError<"expected '}'">
            : Result
        : never;

type ParseFence<Open extends string, Close extends string, CloseKind extends PunctKind, T extends Tokens> =
    ParseRow<T> extends infer Result
        ? Result extends Parsed<infer Inner, infer Rest>
            ? Rest extends [PunctToken<CloseKind>, ...infer After extends Tokens] ? Parsed<FencedNode<Open, Close, One<Inner>>, After> : ParseError<`expected '${Close}'`>
            : Result
        : never;

type CompleteFraction<Numerator, DenominatorResult> =
    DenominatorResult extends Parsed<infer Denominator, infer Rest>
        ? Numerator extends Parsed<infer NumeratorNode, Tokens> ? Parsed<FractionNode<Pair<NumeratorNode, Denominator>>, Rest> : never
        : DenominatorResult;

type ParseFraction<T extends Tokens> =
    ParseBase<T> extends infer Numerator
        ? Numerator extends Parsed<infer NumeratorNode, infer AfterNumerator>
            ? CompleteFraction<Parsed<NumeratorNode, AfterNumerator>, ParseBase<AfterNumerator>>
            : Numerator
        : never;

// The radicand is parsed last, so the leftover tokens come from it, not from the earlier index parse.
type CompleteRoot<IndexNode extends Notation, RadicandResult> =
    RadicandResult extends Parsed<infer RadicandNode, infer Rest> ? Parsed<RadicalNode<Pair<RadicandNode, IndexNode>>, Rest> : RadicandResult;

// The radicand leads so it is `children[0]` whether or not an index follows, even though `\sqrt[Index]{Radicand}`
// writes the index first.
type ParseRoot<T extends Tokens> =
    T extends [PunctToken<PunctKind.BracketOpen>, ...infer AfterOpen extends Tokens]
        ? ParseRow<AfterOpen> extends infer IndexResult
            ? IndexResult extends Parsed<infer IndexNode, infer AfterIndex>
                ? AfterIndex extends [PunctToken<PunctKind.BracketClose>, ...infer AfterClose extends Tokens]
                    ? CompleteRoot<IndexNode, ParseBase<AfterClose>>
                    : ParseError<"expected ']'">
                : IndexResult
            : never
        : ParseBase<T> extends infer Radicand
            ? Radicand extends Parsed<infer RadicandNode, infer Rest> ? Parsed<RadicalNode<One<RadicandNode>>, Rest> : Radicand
            : never;

type CommandBase<Name extends string, Rest extends Tokens> =
    Name extends "frac" ? ParseFraction<Rest>
        : Name extends "sqrt" ? ParseRoot<Rest>
            : Name extends OperatorCommandName ? Parsed<OperatorNode<`\\${Name}`>, Rest> : Parsed<IdentifierNode<`\\${Name}`>, Rest>;

type BaseFrom<Head extends Token, Rest extends Tokens> =
    Head extends NumberToken<infer Value> ? Parsed<NumberNode<Value>, Rest>
        : Head extends LetterToken<infer Name> ? Parsed<IdentifierNode<Name>, Rest>
            : Head extends OperatorToken<infer Symbol> ? Parsed<OperatorNode<Symbol>, Rest>
                : Head extends CommandToken<infer Name> ? CommandBase<Name, Rest>
                    : Head extends PunctToken<PunctKind.BraceOpen> ? ParseGroup<Rest>
                        : Head extends PunctToken<PunctKind.ParenOpen> ? ParseFence<"(", ")", PunctKind.ParenClose, Rest>
                            : Head extends PunctToken<PunctKind.BracketOpen> ? ParseFence<"[", "]", PunctKind.BracketClose, Rest>
                                : ParseError<"expected an expression">;

type ParseBase<T extends Tokens> =
    T extends [infer Head extends Token, ...infer Rest extends Tokens] ? BaseFrom<Head, Rest> : ParseError<"unexpected end of input">;

type ApplyScripts<Base extends Notation, T extends Tokens> =
    T extends [PunctToken<PunctKind.Caret>, ...infer Rest extends Tokens]
        ? WrapSuperscript<Base, ParseBase<Rest>>
        : T extends [PunctToken<PunctKind.Underscore>, ...infer Rest extends Tokens]
            ? WrapSubscript<Base, ParseBase<Rest>>
            : Parsed<Base, T>;

type WrapSuperscript<Base extends Notation, ArgumentResult> =
    ArgumentResult extends Parsed<infer Argument, infer Rest> ? ApplyScripts<SuperscriptNode<Pair<Base, Argument>>, Rest> : ArgumentResult;

type WrapSubscript<Base extends Notation, ArgumentResult> =
    ArgumentResult extends Parsed<infer Argument, infer Rest> ? ApplyScripts<SubscriptNode<Pair<Base, Argument>>, Rest> : ArgumentResult;

type ParseScripted<T extends Tokens> =
    ParseBase<T> extends infer Result ? Result extends Parsed<infer Base, infer Rest> ? ApplyScripts<Base, Rest> : Result : never;

type IsTerminator<Head extends Token> =
    Head extends PunctToken<PunctKind.BraceClose> ? true
        : Head extends PunctToken<PunctKind.ParenClose> ? true
            : Head extends PunctToken<PunctKind.BracketClose> ? true : false;

// LaTeX is presentational, so infix operators build no precedence tree -- a row is a flat element sequence.
type ParseElements<T extends Tokens, Acc extends Content> =
    T extends [infer Head extends Token, ...Tokens]
        ? IsTerminator<Head> extends true
            ? { nodes: Acc, rest: T }
            : ParseScripted<T> extends infer Result
                ? Result extends Parsed<infer Node, infer Rest> ? ParseElements<Rest, readonly [...Acc, Node]> : Result
                : never
        : { nodes: Acc, rest: T };

type ParseRow<T extends Tokens> =
    ParseElements<T, readonly []> extends infer Result
        ? Result extends { nodes: infer Nodes extends Content, rest: infer Rest extends Tokens }
            ? Nodes extends One<infer Only extends Notation> ? Parsed<Only, Rest> : Parsed<RowNode<Nodes>, Rest>
            : Result
        : never;

export type Parse<Source extends string> =
    string extends Source
        ? Notation
        : Tokenize<Source> extends infer T
            ? T extends Tokens
                ? ParseRow<T> extends infer Result
                    ? Result extends Parsed<infer Node, infer Rest>
                        ? Rest extends [] ? Node : ParseError<"unexpected trailing input">
                        : Result
                    : never
                : T
            : never;
