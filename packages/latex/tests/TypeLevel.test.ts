import { test } from "node:test";
import assert from "node:assert/strict";
import { fraction, identifier, number, operator, parse, row, subscript, superscript } from "../src/index.js";
import type {
    FencedNode, FractionNode, IdentifierNode, Notation, NumberNode, One, OperatorNode, Pair, Parse, ParseError,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode
} from "../src/index.js";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type Id<Symbol extends string> = IdentifierNode<Symbol>;
type Num<Value extends number> = NumberNode<Value>;
type Op<Symbol extends string> = OperatorNode<Symbol>;
type Sup<Base extends Notation, Exponent extends Notation> = SuperscriptNode<Pair<Base, Exponent>>;
type Sub<Base extends Notation, Index extends Notation> = SubscriptNode<Pair<Base, Index>>;
type Frac<Numerator extends Notation, Denominator extends Notation> = FractionNode<Pair<Numerator, Denominator>>;

export type Atoms = [
    Assert<Equal<Parse<"x">, Id<"x">>>,
    Assert<Equal<Parse<"42">, Num<42>>>,
    Assert<Equal<Parse<"3.5">, Num<3.5>>>,
    Assert<Equal<Parse<"\\alpha">, Id<"\\alpha">>>
];

// Infix stays flat
export type FlatRow = [
    Assert<Equal<Parse<"a+b">, RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>>,
    Assert<Equal<Parse<"a+b\\cdot c">, RowNode<readonly [Id<"a">, Op<"+">, Id<"b">, Op<"\\cdot">, Id<"c">]>>>,
    Assert<Equal<Parse<"xy">, RowNode<readonly [Id<"x">, Id<"y">]>>>
];

export type Scripts = [
    Assert<Equal<Parse<"x^2">, Sup<Id<"x">, Num<2>>>>,
    Assert<Equal<Parse<"x_i">, Sub<Id<"x">, Id<"i">>>>,
    Assert<Equal<Parse<"x^{a+b}">, Sup<Id<"x">, RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>>>,
    Assert<Equal<Parse<"a_i^2">, SuperscriptNode<Pair<Sub<Id<"a">, Id<"i">>, Num<2>>>>>
];

export type Commands = [
    Assert<Equal<Parse<"\\frac{a}{b}">, Frac<Id<"a">, Id<"b">>>>,
    Assert<Equal<Parse<"\\sqrt{x}">, RadicalNode<One<Id<"x">>>>>,
    Assert<Equal<Parse<"\\sqrt[3]{x}">, RadicalNode<Pair<Id<"x">, Num<3>>>>>,
    Assert<Equal<Parse<"\\frac{1}{2}+x">, RowNode<readonly [Frac<Num<1>, Num<2>>, Op<"+">, Id<"x">]>>>
];

export type Fences = [
    Assert<Equal<Parse<"(a+b)">, FencedNode<"(", ")", One<RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>>>>,
    Assert<Equal<Parse<"(a+b)\\cdot c">, RowNode<readonly [FencedNode<"(", ")", One<RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>>, Op<"\\cdot">, Id<"c">]>>>
];

export type Errors = [
    Assert<Equal<Parse<"\\frac{a}">, ParseError<"unexpected end of input">>>,
    Assert<Equal<Parse<"(a">, ParseError<"expected ')'">>>,
    Assert<Equal<Parse<"{a">, ParseError<"expected '}'">>>,
    Assert<Equal<Parse<"a @ b">, ParseError<"unexpected character in \"@ b\"">>>,

    // A non-literal source degrades to the general `Notation`
    Assert<Equal<Parse<string>, Notation>>
];

await test("the runtime parse matches the type-level Parse for a scripted fraction", () => {
    assert.deepEqual(
        parse("\\frac{a_i}{2}+x^2"),
        row([
            fraction(subscript(identifier("a"), identifier("i")), number(2)),
            operator("+"),
            superscript(identifier("x"), number(2))
        ])
    );
});
