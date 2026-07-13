import type {
    LatexAccentCommand, LatexOperatorCommand, LatexStructuralCommand, OperatorChar
} from "../Specification.js";
import type {
    AccentNode, Content, FencedNode, FractionNode, IdentifierNode, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode
} from "./nodes.js";
import type { LatexStructuralArguments } from "./functions.js";
import type { PayloadKind, PunctKind } from "../Tokenizer.js";
import type {
    BySpelling, DigitChar, FirstMatch, Lead, NumberOf, ParseError, SingleRule, Step, TakeNumber, TakeRun, Whitespace
} from "@dropdeck/common";

type NumberToken<Value extends number = number> = { kind: PayloadKind.Number, value: Value };
type LetterToken<Name extends string = string> = { kind: PayloadKind.Letter, name: Name };
type CommandToken<Name extends string = string> = { kind: PayloadKind.Command, name: Name };
type OperatorToken<Symbol extends string = string> = { kind: PayloadKind.Operator, symbol: Symbol };
type PunctToken<Kind extends PunctKind = PunctKind> = { kind: Kind };

type Token = NumberToken | LetterToken | CommandToken | OperatorToken | PunctToken;
type Tokens = ReadonlyArray<Token>;

type OperatorCommandName = `${LatexOperatorCommand}`;
type AccentCommandName = `${LatexAccentCommand}`;

type AlphaChar =
    | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
    | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
    | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
    | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";

type PunctBySpelling = BySpelling<PunctKind>;
type OperatorCharSpelling = `${OperatorChar}`;

type SpaceRule<S extends string> = Lead<S, Whitespace> extends { rest: infer Rest extends string } ? Step<[], Rest> : false;
type NumberRule<S extends string> =
    Lead<S, DigitChar> extends false ? false
        : TakeNumber<S> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NumberToken<NumberOf<Run>>], Rest> : false;
type LetterTokens = { [Char in AlphaChar]: LetterToken<Char> };
type OperatorTokens = { [Char in OperatorCharSpelling]: OperatorToken<Char> };
type PunctTokens = { [Char in keyof PunctBySpelling]: PunctToken<PunctBySpelling[Char]> };
type LetterRule<S extends string> = SingleRule<S, LetterTokens>;
type OperatorRule<S extends string> = SingleRule<S, OperatorTokens>;
type PunctRule<S extends string> = SingleRule<S, PunctTokens>;
type CommandRule<S extends string> =
    S extends `\\${infer Tail}`
        ? TakeRun<Tail, AlphaChar> extends { run: infer Name extends string, rest: infer Rest extends string }
            ? Name extends "" ? false : Step<[CommandToken<Name>], Rest>
            : false
        : false;

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
        : NextToken<Source> extends Step<infer Produced extends Tokens, infer Rest>
            ? Tokenize<Rest, [...Acc, ...Produced]>
            : ParseError<`Unexpected character at <${Source}>`>;

type Parsed<Node extends Notation, Rest extends Tokens> = { node: Node, rest: Rest };

// The literal text of the next token -- its number, letter, command, operator, or punctuation -- so a diagnostic
// can quote what it actually found as `got <X>`.
type ShowNumber<Head> = Head extends NumberToken<infer Value> ? `${Value}` : false;
type ShowLetter<Head> = Head extends LetterToken<infer Name> ? Name : false;
type ShowCommand<Head> = Head extends CommandToken<infer Name> ? `\\${Name}` : false;
type ShowOperator<Head> = Head extends OperatorToken<infer Symbol> ? Symbol : false;
type ShowPunct<Head> = Head extends PunctToken<infer Kind> ? `${Kind}` : false;
type Got<Head extends Token> = `'${Extract<FirstMatch<[ShowNumber<Head>, ShowLetter<Head>, ShowCommand<Head>, ShowOperator<Head>, ShowPunct<Head>]>, string>}'`;
type Peek<T extends Tokens> = T extends readonly [infer Head extends Token, ...Tokens] ? Got<Head> : "<end of input>";

// A brace group is transparent -- it returns its inner notation, so `{a+b}` and `a+b` parse identically. The row
// result is passed in so it is computed once; a failed inner parse flows straight through as the error.
type CloseGroup<Result> =
    Result extends Parsed<infer Inner, infer Rest>
        ? Rest extends [PunctToken<PunctKind.BraceClose>, ...infer After extends Tokens] ? Parsed<Inner, After> : ParseError<`Expected '}', got ${Peek<Rest>}`>
        : Result;
type ParseGroup<T extends Tokens> = CloseGroup<ParseRow<T>>;

type CloseFence<Open extends string, Close extends string, CloseKind extends PunctKind, Result> =
    Result extends Parsed<infer Inner, infer Rest>
        ? Rest extends [PunctToken<CloseKind>, ...infer After extends Tokens] ? Parsed<FencedNode<Open, Close, One<Inner>>, After> : ParseError<`Expected '${Close}', got ${Peek<Rest>}`>
        : Result;
type ParseFence<Open extends string, Close extends string, CloseKind extends PunctKind, T extends Tokens> =
    CloseFence<Open, Close, CloseKind, ParseRow<T>>;

type CompleteFraction<NumeratorNode extends Notation, DenominatorResult> = DenominatorResult extends Parsed<infer Denominator, infer Rest>
    ? Parsed<FractionNode<Pair<NumeratorNode, Denominator>>, Rest>
    : DenominatorResult;
type CompleteFractionFrom<NumeratorResult> = NumeratorResult extends Parsed<infer NumeratorNode, infer AfterNumerator>
    ? CompleteFraction<NumeratorNode, ParseBase<AfterNumerator>>
    : NumeratorResult;
type ParseFraction<T extends Tokens> = CompleteFractionFrom<ParseBase<T>>;

// The radicand is parsed last, so the leftover tokens come from it, not from the earlier index parse.
type CompleteRoot<IndexNode extends Notation, RadicandResult> =
    RadicandResult extends Parsed<infer RadicandNode, infer Rest> ? Parsed<RadicalNode<Pair<RadicandNode, IndexNode>>, Rest> : RadicandResult;

// The radicand leads so it is `children[0]` whether or not an index follows, even though `\sqrt[Index]{Radicand}`
// writes the index first.
type CompleteRootIndex<Result> =
    Result extends Parsed<infer IndexNode, infer AfterIndex>
        ? AfterIndex extends [PunctToken<PunctKind.BracketClose>, ...infer AfterClose extends Tokens] ? CompleteRoot<IndexNode, ParseBase<AfterClose>> : ParseError<`Expected ']', got ${Peek<AfterIndex>}`>
        : Result;
type CompleteRootRadicand<Result> =
    Result extends Parsed<infer RadicandNode, infer Rest> ? Parsed<RadicalNode<One<RadicandNode>>, Rest> : Result;
type ParseRoot<T extends Tokens> =
    T extends [PunctToken<PunctKind.BracketOpen>, ...infer AfterOpen extends Tokens]
        ? CompleteRootIndex<ParseRow<AfterOpen>>
        : CompleteRootRadicand<ParseBase<T>>;

// An accent binds the single base that follows, so `\hat x` and `\hat{x}` both wrap `x`.
type CompleteAccent<Command extends string, BaseResult> =
    BaseResult extends Parsed<infer Base extends Notation, infer Rest> ? Parsed<AccentNode<Command, One<Base>>, Rest> : BaseResult;

// One flat parser per structural command. The name resolution is keyed off `LatexStructuralArguments` -- the same
// record the serializer uses -- so a command added there without a parser here fails to compile, keeping the two
// sides in step. Its spelling resolves to the enum key via `StructuralCommandName`.
type StructuralParse<Rest extends Tokens> = {
    [LatexStructuralCommand.Frac]: ParseFraction<Rest>,
    [LatexStructuralCommand.Sqrt]: ParseRoot<Rest>
};
type StructuralCommandName = { [Command in keyof LatexStructuralArguments as `${Command}`]: Command };
type StructuralCommand<Name extends string, Rest extends Tokens> =
    Name extends keyof StructuralCommandName ? StructuralParse<Rest>[StructuralCommandName[Name]] : false;

// Accents wrap the next base, listed operators become operator nodes, and any other command falls through to an
// identifier glyph -- the fallback that always matches, so it is the last rule.
type AccentCommand<Name extends string, Rest extends Tokens> = Name extends AccentCommandName ? CompleteAccent<Name, ParseBase<Rest>> : false;
type OperatorCommand<Name extends string, Rest extends Tokens> = Name extends OperatorCommandName ? Parsed<OperatorNode<`\\${Name}`>, Rest> : false;

type CommandBase<Name extends string, Rest extends Tokens> = FirstMatch<[
    StructuralCommand<Name, Rest>,
    AccentCommand<Name, Rest>,
    OperatorCommand<Name, Rest>,
    Parsed<IdentifierNode<`\\${Name}`>, Rest>
]>;

type NumberBase<Head extends Token, Rest extends Tokens> = Head extends NumberToken<infer Value> ? Parsed<NumberNode<Value>, Rest> : false;
type LetterBase<Head extends Token, Rest extends Tokens> = Head extends LetterToken<infer Name> ? Parsed<IdentifierNode<Name>, Rest> : false;
type OperatorBase<Head extends Token, Rest extends Tokens> = Head extends OperatorToken<infer Symbol> ? Parsed<OperatorNode<Symbol>, Rest> : false;
type CommandTokenBase<Head extends Token, Rest extends Tokens> = Head extends CommandToken<infer Name> ? CommandBase<Name, Rest> : false;
type GroupBase<Head extends Token, Rest extends Tokens> = Head extends PunctToken<PunctKind.BraceOpen> ? ParseGroup<Rest> : false;
type ParenBase<Head extends Token, Rest extends Tokens> = Head extends PunctToken<PunctKind.ParenOpen> ? ParseFence<"(", ")", PunctKind.ParenClose, Rest> : false;
type BracketBase<Head extends Token, Rest extends Tokens> = Head extends PunctToken<PunctKind.BracketOpen> ? ParseFence<"[", "]", PunctKind.BracketClose, Rest> : false;

type BaseFrom<Head extends Token, Rest extends Tokens> = FirstMatch<[
    NumberBase<Head, Rest>,
    LetterBase<Head, Rest>,
    OperatorBase<Head, Rest>,
    CommandTokenBase<Head, Rest>,
    GroupBase<Head, Rest>,
    ParenBase<Head, Rest>,
    BracketBase<Head, Rest>,
    ParseError<`Expected an expression, got ${Got<Head>}`>
]>;

type ParseBase<T extends Tokens> =
    T extends [infer Head extends Token, ...infer Rest extends Tokens] ? BaseFrom<Head, Rest> : ParseError<"Expected an expression, got <end of input>">;

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

type ApplyScriptsFrom<Result> =
    Result extends Parsed<infer Base, infer Rest> ? ApplyScripts<Base, Rest> : Result;
type ParseScripted<T extends Tokens> = ApplyScriptsFrom<ParseBase<T>>;

type IsTerminator<Head extends Token> = Head extends PunctToken<
    | PunctKind.BraceClose
    | PunctKind.ParenClose
    | PunctKind.BracketClose
> ? true : false;

// LaTeX is presentational, so infix operators build no precedence tree -- a row is a flat element sequence.
type ContinueElements<Result, Acc extends Content> =
    Result extends Parsed<infer Node, infer Rest> ? ParseElements<Rest, readonly [...Acc, Node]> : Result;
type ParseElements<T extends Tokens, Acc extends Content> =
    T extends [infer Head extends Token, ...Tokens]
        ? IsTerminator<Head> extends true
            ? { nodes: Acc, rest: T }
            : ContinueElements<ParseScripted<T>, Acc>
        : { nodes: Acc, rest: T };

type CompleteRow<Result> =
    Result extends { nodes: infer Nodes extends Content, rest: infer Rest extends Tokens }
        ? Nodes extends One<infer Only extends Notation> ? Parsed<Only, Rest> : Parsed<RowNode<Nodes>, Rest>
        : Result;
type ParseRow<T extends Tokens> = CompleteRow<ParseElements<T, readonly []>>;

type CompleteParse<Result> =
    Result extends Parsed<infer Node, infer Rest> ? (Rest extends [] ? Node : ParseError<`Expected end of input, got ${Peek<Rest>}`>) : Result;
type ParseTokens<T> = T extends Tokens ? CompleteParse<ParseRow<T>> : T;

export type Parse<Source extends string> =
    string extends Source ? Notation : ParseTokens<Tokenize<Source>>;
