import { test, expect } from "vitest";
import { parse } from "@dropdeck/math";
import {
    fenced, fraction, identifier, lowerMath, number, operator, radical, row, subscript, superscript
} from "#/formula";
import type { Expression, Parse } from "@dropdeck/math";
import type {
    FencedNode, FractionNode, IdentifierNode, LowerMath, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode
} from "#/formula";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Lower<S extends string> = Parse<S> extends infer E extends Expression ? LowerMath<E> : never;

type Id<Symbol extends string> = IdentifierNode<Symbol>;
type Num<Value extends number> = NumberNode<Value>;
type Op<Symbol extends string> = OperatorNode<Symbol>;
type Sub<Base extends Notation, Index extends Notation> = SubscriptNode<Pair<Base, Index>>;
type Sup<Base extends Notation, Exponent extends Notation> = SuperscriptNode<Pair<Base, Exponent>>;
type Frac<Numerator extends Notation, Denominator extends Notation> = FractionNode<Pair<Numerator, Denominator>>;
type Grouped<Inner extends Notation> = FencedNode<"(", ")", One<Inner>>;

export type Leaves = [
    Expect<Equal<Lower<"x">, Id<"x">>>,
    Expect<Equal<Lower<"42">, Num<42>>>,
    Expect<Equal<Lower<"pi">, Id<"π">>>,
    // A semantic subscripted name becomes a presentational subscript -- the load-bearing math<->shared divergence.
    Expect<Equal<Lower<"x_i">, Sub<Id<"x">, Id<"i">>>>
];

export type TwoDimensional = [
    Expect<Equal<Lower<"x^2">, Sup<Id<"x">, Num<2>>>>,
    Expect<Equal<Lower<"a/b">, Frac<Id<"a">, Id<"b">>>>,
    Expect<Equal<Lower<"sqrt(x)">, RadicalNode<One<Id<"x">>>>>,
    // Power is semantic in math but presentational here; the base fences only when it is a flat-row binary.
    Expect<Equal<Lower<"(a+b)^2">, Sup<Grouped<RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>, Num<2>>>>
];

export type Rows = [
    Expect<Equal<Lower<"a+b">, RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>>,
    Expect<Equal<Lower<"a<=b">, RowNode<readonly [Id<"a">, Op<"≤">, Id<"b">]>>>,
    // Multiply binds tighter than add, so the inner product needs no fence.
    Expect<Equal<Lower<"a*b+c">, RowNode<readonly [RowNode<readonly [Id<"a">, Op<"·">, Id<"b">]>, Op<"+">, Id<"c">]>>>,
    // The looser sum inside a product must fence, restoring the parentheses the tree encodes.
    Expect<Equal<Lower<"(a+b)*c">, RowNode<readonly [Grouped<RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>, Op<"·">, Id<"c">]>>>
];

export type Unary = [
    Expect<Equal<Lower<"-a">, RowNode<readonly [Op<"-">, Id<"a">]>>>,
    Expect<Equal<Lower<"-(a+b)">, RowNode<readonly [Op<"-">, Grouped<RowNode<readonly [Id<"a">, Op<"+">, Id<"b">]>>]>>>
];

test("the runtime lowering matches the type-level LowerMath", () => {
    expect(lowerMath(parse("x_i"))).toEqual(subscript(identifier("x"), identifier("i")));
    expect(lowerMath(parse("pi"))).toEqual(identifier("π"));
    expect(lowerMath(parse("x^2"))).toEqual(superscript(identifier("x"), number(2)));
    expect(lowerMath(parse("a/b"))).toEqual(fraction(identifier("a"), identifier("b")));
    expect(lowerMath(parse("sqrt(x)"))).toEqual(radical(identifier("x")));
    expect(lowerMath(parse("(a+b)*c"))).toEqual(row([
        fenced("(", ")", [row([identifier("a"), operator("+"), identifier("b")])]),
        operator("·"),
        identifier("c")
    ]));
});
