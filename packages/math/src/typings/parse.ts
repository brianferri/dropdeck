import type { BinaryOperator, MathConstant, UnaryOperator } from "../Specification.js";
import type { AdditiveOperator, ComparisonOperator, MultiplicativeOperator } from "./operators.js";
import type {
    BinaryNode, CallNode, Content, ConstantNode, Expression, NegateNode, NotNode, NumberNode, One, Pair, VariableNode
} from "./nodes.js";
import type { PayloadKind, PunctKind } from "../Tokenizer.js";
import type {
    BySpelling, DigitChar, DoubleRule, FirstMatch, Lead, NumberOf, ParseError, SingleRule, Step, TakeNumber, TakeRun,
    Whitespace
} from "@dropdeck/common";

type Operator = BinaryOperator | UnaryOperator;

type OperatorBySpelling = BySpelling<Operator>;
type ConstantBySpelling = BySpelling<MathConstant>;
type PunctBySpelling = BySpelling<PunctKind>;

type AlphaChar =
    | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
    | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
    | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
    | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" | "_";

type NumberToken<Value extends number = number> = { kind: PayloadKind.Number, value: Value };
type NameToken<Name extends string = string> = { kind: PayloadKind.Name, name: Name };
type OperatorToken<Op extends Operator = Operator> = { kind: PayloadKind.Operator, operator: Op };
type PunctToken<Kind extends PunctKind = PunctKind> = { kind: Kind };
type Token = NumberToken | NameToken | OperatorToken | PunctToken;
type Tokens = ReadonlyArray<Token>;

// A run of letters is an operator IFF it spells one (`and`, `or`), otherwise a plain name.
type NameTokenOf<Run extends string> =
    Run extends keyof OperatorBySpelling ? OperatorToken<OperatorBySpelling[Run]> : NameToken<Run>;

type PunctTokens = { [Char in keyof PunctBySpelling]: PunctToken<PunctBySpelling[Char]> };
type OperatorTokens = { [Char in keyof OperatorBySpelling]: OperatorToken<OperatorBySpelling[Char]> };

type SpaceRule<S extends string> = Lead<S, Whitespace> extends { rest: infer Rest extends string } ? Step<[], Rest> : false;
type PairRule<S extends string> = DoubleRule<S, OperatorTokens>;
type CharRule<S extends string> = SingleRule<S, OperatorTokens>;
type PunctRule<S extends string> = SingleRule<S, PunctTokens>;
type NumberRule<S extends string> =
    Lead<S, DigitChar> extends false ? false
        : TakeNumber<S> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NumberToken<NumberOf<Run>>], Rest> : false;
type NameRule<S extends string> =
    Lead<S, AlphaChar> extends false ? false
        : TakeRun<S, AlphaChar | DigitChar> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NameTokenOf<Run>], Rest> : false;

type NextToken<S extends string> = FirstMatch<readonly [
    SpaceRule<S>,
    PairRule<S>,
    NumberRule<S>,
    NameRule<S>,
    PunctRule<S>,
    CharRule<S>
]>;

type Tokenize<Source extends string, Acc extends Tokens = []> =
    Source extends "" ? Acc
        : NextToken<Source> extends Step<infer Produced extends Tokens, infer Rest>
            ? Tokenize<Rest, [...Acc, ...Produced]>
            : ParseError<`Unexpected character at <${Source}>`>;

type Parsed<Node extends Expression, Rest extends Tokens> = { node: Node, rest: Rest };

type ShowNumber<Head> = Head extends NumberToken<infer Value> ? `${Value}` : false;
type ShowName<Head> = Head extends NameToken<infer Name> ? Name : false;
type ShowOperator<Head> = Head extends OperatorToken<infer Op> ? `${Op}` : false;
type ShowPunct<Head> = Head extends PunctToken<infer Kind> ? `${Kind}` : false;
type Got<Head extends Token> = `'${Extract<FirstMatch<[
    ShowNumber<Head>,
    ShowName<Head>,
    ShowOperator<Head>,
    ShowPunct<Head>
]>, string>}'`;
type Peek<T extends Tokens> = T extends readonly [infer Head extends Token, ...Tokens] ? Got<Head> : "<end of input>";

type ParseArgs<T extends Tokens, Acc extends Content = readonly []> =
    T extends [{ kind: PunctKind.Close }, ...infer Rest extends Tokens]
        ? { args: Acc, rest: Rest }
        : ContinueArg<ParseBinary<T>, Acc>;

type ContinueArg<Result, Acc extends Content> =
    Result extends Parsed<infer Node, infer After> ? AfterArg<After, readonly [...Acc, Node]> : Result;

type AfterArg<After extends Tokens, Acc extends Content> =
    After extends [{ kind: PunctKind.Comma }, ...infer Rest extends Tokens]
        ? ParseArgs<Rest, Acc>
        : After extends [{ kind: PunctKind.Close }, ...infer Rest extends Tokens]
            ? { args: Acc, rest: Rest }
            : ParseError<`Expected ',' or ')', got ${Peek<After>}`>;

type NameAtom<Name extends string, Rest extends Tokens> =
    Name extends keyof ConstantBySpelling ? Parsed<ConstantNode<ConstantBySpelling[Name]>, Rest> : Parsed<VariableNode<Name>, Rest>;

type CompleteCall<Name extends string, Result> =
    Result extends { args: infer Args extends Content, rest: infer After extends Tokens } ? Parsed<CallNode<Name, Args>, After> : Result;

type CloseGroup<Result> =
    Result extends Parsed<infer Node, infer After>
        ? After extends [{ kind: PunctKind.Close }, ...infer Rest extends Tokens]
            ? Parsed<Node, Rest>
            : ParseError<`Expected ')', got ${Peek<After>}`>
        : Result;

type NumberPrimary<Head extends Token, Rest extends Tokens> =
    Head extends NumberToken<infer Value> ? Parsed<NumberNode<Value>, Rest> : false;
type NamePrimary<Head extends Token, Rest extends Tokens> =
    Head extends NameToken<infer Name>
        ? Rest extends [{ kind: PunctKind.Open }, ...infer Args extends Tokens] ? CompleteCall<Name, ParseArgs<Args>> : NameAtom<Name, Rest>
        : false;
type GroupPrimary<Head extends Token, Rest extends Tokens> =
    Head extends { kind: PunctKind.Open } ? CloseGroup<ParseBinary<Rest>> : false;

type PrimaryFrom<Match, Head extends Token> = [Match] extends [false]
    ? ParseError<`Expected an expression, got ${Got<Head>}`> : Match;
type ParsePrimary<T extends Tokens> =
    T extends [infer Head extends Token, ...infer Rest extends Tokens]
        ? PrimaryFrom<FirstMatch<readonly [
            NumberPrimary<Head, Rest>,
            NamePrimary<Head, Rest>,
            GroupPrimary<Head, Rest>
        ]>, Head>
        : ParseError<"Expected an expression, got <end of input>">;

type WrapNot<Result> =
    Result extends Parsed<infer Operand, infer After> ? Parsed<NotNode<One<Operand>>, After> : Result;
type WrapNegate<Result> =
    Result extends Parsed<infer Operand, infer After> ? Parsed<NegateNode<One<Operand>>, After> : Result;

type ParseUnary<T extends Tokens> =
    T extends [OperatorToken<UnaryOperator.Not>, ...infer Rest extends Tokens] ? WrapNot<ParseUnary<Rest>>
        : T extends [OperatorToken<BinaryOperator.Subtract>, ...infer Rest extends Tokens] ? WrapNegate<ParseUnary<Rest>>
            : ParsePrimary<T>;

type FoldPower<Left extends Expression, Result> =
    Result extends Parsed<infer Right, infer After> ? Parsed<BinaryNode<BinaryOperator.Power, Pair<Left, Right>>, After> : Result;

type ClimbPower<Base> =
    Base extends Parsed<infer Left, infer Rest>
        ? Rest extends [OperatorToken<BinaryOperator.Power>, ...infer Tail extends Tokens] ? FoldPower<Left, ParsePower<Tail>> : Base
        : Base;

type ParsePower<T extends Tokens> = ClimbPower<ParseUnary<T>>;

type BinaryTiers = [
    BinaryOperator.Or,
    BinaryOperator.And,
    ComparisonOperator,
    AdditiveOperator,
    MultiplicativeOperator
];
type NextLevel = [1, 2, 3, 4, 5];

// The right operand is parsed once and passed in; a failed operand parse flows through as the error.
type FoldTierRight<Ops extends BinaryOperator,
    Level extends number,
    Op extends BinaryOperator,
    Left extends Expression, Result
> = Result extends Parsed<infer Right, infer After>
    ? FoldTier<Ops, Level, BinaryNode<Op, Pair<Left, Right>>, After>
    : Result;
type FoldTier<Ops extends BinaryOperator, Level extends number, Left extends Expression, T extends Tokens> =
    T extends [OperatorToken<infer Op>, ...infer Rest extends Tokens]
        ? Op extends Ops
            ? FoldTierRight<Ops, Level, Op, Left, ParseTier<Rest, NextLevel[Level]>>
            : Parsed<Left, T>
        : Parsed<Left, T>;

type FoldTierFrom<Ops extends BinaryOperator, Level extends number, Base> =
    Base extends Parsed<infer Left, infer Rest> ? FoldTier<Ops, Level, Left, Rest> : Base;
type ParseTier<T extends Tokens, Level extends number> =
    Level extends BinaryTiers["length"]
        ? ParsePower<T>
        : FoldTierFrom<BinaryTiers[Level], Level, ParseTier<T, NextLevel[Level]>>;

type ParseBinary<T extends Tokens> = ParseTier<T, 0>;

// A complete parse consumes every token; leftovers mean the parser stopped early, so they are reported.
type CompleteParse<Result> = Result extends Parsed<infer Node, infer Rest>
    ? (Rest extends []
        ? Node
        : ParseError<`Expected end of input, got ${Peek<Rest>}`>
    ) : Result;

type ParseTokens<T> = T extends Tokens ? CompleteParse<ParseBinary<T>> : T;

export type Parse<Source extends string> =
    string extends Source ? Expression : ParseTokens<Tokenize<Source>>;
