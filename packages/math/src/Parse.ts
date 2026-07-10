import type { AdditiveOperator, BinaryOperator, ComparisonOperator, MathConstant, MultiplicativeOperator, UnaryOperator } from "./Specification.js";
import type {
    BinaryNode, CallNode, Content, ConstantNode, Expression, NegateNode, NotNode, NumberNode, One, Pair, VariableNode
} from "./Specification.js";
import type { TokenKind } from "./Tokenizer.js";

type Operator = BinaryOperator | UnaryOperator;

type OperatorBySpelling = { [Op in Operator as `${Op}`]: Op };
type ConstantBySpelling = { [Name in MathConstant as `${Name}`]: Name };
type PunctBySpelling = { [Kind in TokenKind.Open | TokenKind.Close | TokenKind.Comma as `${Kind}`]: Kind };

type DigitChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type AlphaChar =
    | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
    | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
    | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
    | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" | "_";
type Whitespace = " " | "\n" | "\t" | "\r";

type PunctKind = TokenKind.Open | TokenKind.Close | TokenKind.Comma;
type NumberToken<Value extends number = number> = { kind: TokenKind.Number, value: Value };
type NameToken<Name extends string = string> = { kind: TokenKind.Name, name: Name };
type OperatorToken<Op extends Operator = Operator> = { kind: TokenKind.Operator, operator: Op };
type PunctToken<Kind extends PunctKind = PunctKind> = { kind: Kind };
type Token = NumberToken | NameToken | OperatorToken | PunctToken;
type Tokens = ReadonlyArray<Token>;

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
type NameTokenOf<Run extends string> =
    Run extends keyof OperatorBySpelling ? OperatorToken<OperatorBySpelling[Run]> : NameToken<Run>;

type SpaceRule<S extends string> = S extends `${Whitespace}${infer Rest}` ? Step<[], Rest> : false;
type PairRule<S extends string> =
    S extends `${infer A}${infer B}${infer Rest}`
        ? `${A}${B}` extends keyof OperatorBySpelling ? Step<[OperatorToken<OperatorBySpelling[`${A}${B}`]>], Rest> : false
        : false;
type NumberRule<S extends string> =
    S extends `${infer Head}${string}`
        ? Head extends DigitChar
            ? TakeNumber<S> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NumberToken<NumberOf<Run>>], Rest> : false
            : false
        : false;
type NameRule<S extends string> =
    S extends `${infer Head}${string}`
        ? Head extends AlphaChar
            ? TakeRun<S, AlphaChar> extends { run: infer Run extends string, rest: infer Rest extends string } ? Step<[NameTokenOf<Run>], Rest> : false
            : false
        : false;
type PunctRule<S extends string> =
    S extends `${infer Head}${infer Rest}` ? Head extends keyof PunctBySpelling ? Step<[PunctToken<PunctBySpelling[Head]>], Rest> : false : false;
type CharRule<S extends string> =
    S extends `${infer Head}${infer Rest}` ? Head extends keyof OperatorBySpelling ? Step<[OperatorToken<OperatorBySpelling[Head]>], Rest> : false : false;

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
        : NextToken<Source> extends Step<infer Produced, infer Rest>
            ? Tokenize<Rest, [...Acc, ...Produced]>
            : ParseError<`unexpected character in "${Source}"`>;

export type ParseError<Message extends string = string> = { parseError: Message };
type Parsed<Node extends Expression, Rest extends Tokens> = { node: Node, rest: Rest };

type ParseArgs<T extends Tokens, Acc extends Content = readonly []> =
    T extends [{ kind: TokenKind.Close }, ...infer Rest extends Tokens]
        ? { args: Acc, rest: Rest }
        : ContinueArg<ParseBinary<T>, Acc>;

type ContinueArg<Result, Acc extends Content> =
    Result extends Parsed<infer Node, infer After> ? AfterArg<After, readonly [...Acc, Node]> : Result;

type AfterArg<After extends Tokens, Acc extends Content> =
    After extends [{ kind: TokenKind.Comma }, ...infer Rest extends Tokens]
        ? ParseArgs<Rest, Acc>
        : After extends [{ kind: TokenKind.Close }, ...infer Rest extends Tokens]
            ? { args: Acc, rest: Rest }
            : ParseError<"expected ',' or ')'">;

type NameAtom<Name extends string, Rest extends Tokens> =
    Name extends keyof ConstantBySpelling ? Parsed<ConstantNode<ConstantBySpelling[Name]>, Rest> : Parsed<VariableNode<Name>, Rest>;

type CompleteCall<Name extends string, Result> =
    Result extends { args: infer Args extends Content, rest: infer After extends Tokens } ? Parsed<CallNode<Name, Args>, After> : Result;

type CloseGroup<Result> =
    Result extends Parsed<infer Node, infer After>
        ? After extends [{ kind: TokenKind.Close }, ...infer Rest extends Tokens] ? Parsed<Node, Rest> : ParseError<"expected ')'">
        : Result;

type NumberPrimary<Head extends Token, Rest extends Tokens> =
    Head extends NumberToken<infer Value> ? Parsed<NumberNode<Value>, Rest> : false;
type NamePrimary<Head extends Token, Rest extends Tokens> =
    Head extends NameToken<infer Name>
        ? Rest extends [{ kind: TokenKind.Open }, ...infer Args extends Tokens] ? CompleteCall<Name, ParseArgs<Args>> : NameAtom<Name, Rest>
        : false;
type GroupPrimary<Head extends Token, Rest extends Tokens> =
    Head extends { kind: TokenKind.Open } ? CloseGroup<ParseBinary<Rest>> : false;

type ParsePrimary<T extends Tokens> =
    T extends [infer Head extends Token, ...infer Rest extends Tokens]
        ? FirstMatch<readonly [NumberPrimary<Head, Rest>, NamePrimary<Head, Rest>, GroupPrimary<Head, Rest>]> extends infer Match
            ? [Match] extends [false] ? ParseError<"expected an expression"> : Match
            : never
        : ParseError<"unexpected end of input">;

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

type FoldTier<Ops extends BinaryOperator, Level extends number, Left extends Expression, T extends Tokens> =
    T extends [OperatorToken<infer Op>, ...infer Rest extends Tokens]
        ? Op extends Ops
            ? ParseTier<Rest, NextLevel[Level]> extends infer Result
                ? Result extends Parsed<infer Right, infer After>
                    ? FoldTier<Ops, Level, BinaryNode<Op, Pair<Left, Right>>, After>
                    : Result
                : never
            : Parsed<Left, T>
        : Parsed<Left, T>;

type ParseTier<T extends Tokens, Level extends number> =
    Level extends BinaryTiers["length"]
        ? ParsePower<T>
        : ParseTier<T, NextLevel[Level]> extends infer Base
            ? Base extends Parsed<infer Left, infer Rest>
                ? FoldTier<BinaryTiers[Level], Level, Left, Rest>
                : Base
            : never;

type ParseBinary<T extends Tokens> = ParseTier<T, 0>;

export type Parse<Source extends string> =
    string extends Source
        ? Expression
        : Tokenize<Source> extends infer T
            ? T extends Tokens
                ? ParseBinary<T> extends infer Result
                    ? Result extends Parsed<infer Node, infer Rest>
                        ? Rest extends [] ? Node : ParseError<"unexpected trailing input">
                        : Result
                    : never
                : T
            : never;
