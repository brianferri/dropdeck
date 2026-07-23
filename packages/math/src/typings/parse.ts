import type { BinaryOperator, MathConstant, OPERATOR_PRECEDENCE, UnaryOperator } from "../Specification.js";
import type {
    BinaryNode, CallNode, Content, ConstantNode, Expression, NegateNode, NotNode, NumberNode, One, Pair, VariableNode
} from "./nodes.js";
import type { PayloadKind, PunctKind } from "../Tokenizer.js";
import type {
    AlphaChar as Letter, BySpelling, DigitChar, FirstMatch, LeadN, LongestRule, NumberOf, OrError, Parsed as ParsedOf,
    ParseError, Repeat, SpaceRule, Step, TakeNumber, TakeRun
} from "@dropdeck/common";

type Operator = BinaryOperator | UnaryOperator;

type OperatorBySpelling = BySpelling<Operator>;
type ConstantBySpelling = BySpelling<MathConstant>;
type PunctBySpelling = BySpelling<PunctKind>;

// Math names may carry `_` (`x_i`), which pure letters exclude.
type AlphaChar = Letter | "_";

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

// The widest symbol operator is three characters (`===`, `~==`); longest-match tries this width down to one.
type OperatorWidthMax = 3;

type PunctRule<S extends string> = LongestRule<S, PunctTokens, 1>;
type NumberRule<S extends string> =
    LeadN<S, DigitChar, 1> extends false ? false
        : TakeNumber<S> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NumberToken<NumberOf<Run>>], Rest> : false;
type NameRule<S extends string> =
    LeadN<S, AlphaChar, 1> extends false ? false
        : TakeRun<S, AlphaChar | DigitChar> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NameTokenOf<Run>], Rest> : false;

type NextToken<S extends string> = FirstMatch<readonly [
    SpaceRule<S>,
    NumberRule<S>,
    NameRule<S>,
    PunctRule<S>,
    LongestRule<S, OperatorTokens, OperatorWidthMax>
]>;

type Tokenize<Source extends string, Acc extends Tokens = []> =
    Source extends "" ? Acc
        : NextToken<Source> extends Step<infer Produced extends Tokens, infer Rest>
            ? Tokenize<Rest, [...Acc, ...Produced]>
            : ParseError<`Unexpected character at <${Source}>`>;

type Parsed<Node extends Expression, Rest extends Tokens> = ParsedOf<Node, Rest>;

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

type ParsePrimary<T extends Tokens> =
    T extends [infer Head extends Token, ...infer Rest extends Tokens]
        ? OrError<FirstMatch<readonly [
            NumberPrimary<Head, Rest>,
            NamePrimary<Head, Rest>,
            GroupPrimary<Head, Rest>
        ]>, `Expected an expression, got ${Got<Head>}`>
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

// The tiers mirror the runtime parser: fold operators by their `OPERATOR_PRECEDENCE` level, loosest first, so one
// precedence table drives both the compile-time and runtime parse and the two cannot drift.
type PowerLevel = (typeof OPERATOR_PRECEDENCE)[BinaryOperator.Power];
type NextLevel<Level extends number> = [...Repeat<unknown, Level>, unknown]["length"] & number;
type OperatorsAtLevel<Level extends number> =
    { [Op in BinaryOperator]: (typeof OPERATOR_PRECEDENCE)[Op] extends Level ? Op : never }[BinaryOperator];

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
            ? FoldTierRight<Ops, Level, Op, Left, ParseTier<Rest, NextLevel<Level>>>
            : Parsed<Left, T>
        : Parsed<Left, T>;

type FoldTierFrom<Ops extends BinaryOperator, Level extends number, Base> =
    Base extends Parsed<infer Left, infer Rest> ? FoldTier<Ops, Level, Left, Rest> : Base;
type ParseTier<T extends Tokens, Level extends number> =
    Level extends PowerLevel
        ? ParsePower<T>
        : FoldTierFrom<OperatorsAtLevel<Level>, Level, ParseTier<T, NextLevel<Level>>>;

// Precedence levels start at one (the loosest tier), matching the runtime parser's `parseBinaryAt(cursor, 1)`.
type ParseBinary<T extends Tokens> = ParseTier<T, 1>;

// A complete parse consumes every token; leftovers mean the parser stopped early, so they are reported.
type CompleteParse<Result> = Result extends Parsed<infer Node, infer Rest>
    ? (Rest extends []
        ? Node
        : ParseError<`Expected end of input, got ${Peek<Rest>}`>
    ) : Result;

type ParseTokens<T> = T extends Tokens ? CompleteParse<ParseBinary<T>> : T;

export type Parse<Source extends string> =
    string extends Source ? Expression : ParseTokens<Tokenize<Source>>;
