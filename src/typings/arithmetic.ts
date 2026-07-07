// Type-level decimal arithmetic on non-negative integer literals. Numbers are processed digit by digit (not as a
// tuple of their whole magnitude), so a result is not bounded by TypeScript's ~10k tuple-length ceiling -- an EMU
// coordinate runs into the millions. Digits are held least-significant-first for the duration of a computation.

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type DigitList = ReadonlyArray<Digit>;
type Units = ReadonlyArray<unknown>;

// A decimal digit as a tuple of that length, so single-digit sums and products ride TypeScript's tuple arithmetic.
/* eslint-disable @typescript-eslint/naming-convention */
type Ones<D extends Digit> = {
    0: [],
    1: [0],
    2: [0, 0],
    3: [0, 0, 0],
    4: [0, 0, 0, 0],
    5: [0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0, 0],
    7: [0, 0, 0, 0, 0, 0, 0],
    8: [0, 0, 0, 0, 0, 0, 0, 0],
    9: [0, 0, 0, 0, 0, 0, 0, 0, 0]
}[D];
/* eslint-enable @typescript-eslint/naming-convention */

// Indexing this by a length 0..9 recovers that digit -- `Char[n]` is `n`, so it also pins the result to a `Digit`.
type Char = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
type Ten = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Splits a tuple's length into its units digit and the carry above it, by removing tens until fewer than ten remain.
type DivMod10<T extends Units, Carry extends Units = []> =
    T extends [...Ten, ...infer Rest] ? DivMod10<Rest, [...Carry, 0]> : { digit: Char[T["length"] & number], carry: Carry };

type Split<S extends string, Acc extends DigitList = []> =
    S extends `${infer Head extends Digit}${infer Tail}` ? Split<Tail, [...Acc, Head]> : Acc;

type Reverse<T extends Units, Acc extends Units = []> =
    T extends [infer Head, ...infer Tail] ? Reverse<Tail, [Head, ...Acc]> : Acc;

type Join<T extends DigitList> =
    T extends [infer Head extends Digit, ...infer Tail extends DigitList] ? `${Head}${Join<Tail>}` : "";

type Trim<T extends DigitList> =
    T extends [0, ...infer Rest extends DigitList] ? (Rest extends [] ? [0] : Trim<Rest>) : T;

// A non-negative integer literal to/from its least-significant-first digit list.
type ToDigits<N extends number> = Reverse<Split<`${N}`>>;
type FromDigits<T extends DigitList> = Join<Trim<Reverse<T>>> extends `${infer N extends number}` ? N : never;

// A tuple of length A x B, by laying down `A` once per element of `B`.
type Times<A extends Units, B extends Units, Acc extends Units = []> =
    B extends [unknown, ...infer Rest] ? Times<A, Rest, [...Acc, ...A]> : Acc;

type AddDigits<A extends DigitList, B extends DigitList, Carry extends Units = []> =
    A extends [infer Ah extends Digit, ...infer At extends DigitList]
        ? B extends [infer Bh extends Digit, ...infer Bt extends DigitList]
            ? DivMod10<[...Ones<Ah>, ...Ones<Bh>, ...Carry]> extends { digit: infer R extends Digit, carry: infer C extends Units }
                ? [R, ...AddDigits<At, Bt, C>] : never
            : DivMod10<[...Ones<Ah>, ...Carry]> extends { digit: infer R extends Digit, carry: infer C extends Units }
                ? [R, ...AddDigits<At, [], C>] : never
        : B extends [infer Bh extends Digit, ...infer Bt extends DigitList]
            ? DivMod10<[...Ones<Bh>, ...Carry]> extends { digit: infer R extends Digit, carry: infer C extends Units }
                ? [R, ...AddDigits<[], Bt, C>] : never
            : Carry extends [] ? [] : [Char[Carry["length"] & number]];

type MulByDigit<A extends DigitList, D extends Digit, Carry extends Units = []> =
    A extends [infer Ah extends Digit, ...infer At extends DigitList]
        ? DivMod10<[...Times<Ones<Ah>, Ones<D>>, ...Carry]> extends { digit: infer R extends Digit, carry: infer C extends Units }
            ? [R, ...MulByDigit<At, D, C>] : never
        : Carry extends [] ? [] : [Char[Carry["length"] & number]];

// Long multiplication: each digit of B scales A, shifted one place left per position, summed into the accumulator.
type MulDigits<A extends DigitList, B extends DigitList, Shift extends DigitList = [], Acc extends DigitList = [0]> =
    B extends [infer Bh extends Digit, ...infer Bt extends DigitList]
        ? MulDigits<A, Bt, [...Shift, 0], AddDigits<Acc, [...Shift, ...MulByDigit<A, Bh>]>>
        : Acc;

// One digit less another, borrowing a ten when it would go negative.
type SubDigit<A extends Units, B extends Units> =
    A extends [...B, ...infer Diff] ? { digit: Char[Diff["length"] & number], borrow: [] }
        : [...Ten, ...A] extends [...B, ...infer Diff] ? { digit: Char[Diff["length"] & number], borrow: [0] }
            : never;

type SubDigits<A extends DigitList, B extends DigitList, Borrow extends Units = []> =
    A extends [infer Ah extends Digit, ...infer At extends DigitList]
        ? B extends [infer Bh extends Digit, ...infer Bt extends DigitList]
            ? SubDigit<Ones<Ah>, [...Ones<Bh>, ...Borrow]> extends { digit: infer R extends Digit, borrow: infer Bo extends Units }
                ? [R, ...SubDigits<At, Bt, Bo>] : never
            : SubDigit<Ones<Ah>, Borrow> extends { digit: infer R extends Digit, borrow: infer Bo extends Units }
                ? [R, ...SubDigits<At, [], Bo>] : never
        : [];

// Two same-magnitude digit lists compared shorter/longer, so the wider number wins before digits are inspected.
type LenCompare<A extends Units, B extends Units> =
    A extends [unknown, ...infer At] ? (B extends [unknown, ...infer Bt] ? LenCompare<At, Bt> : "gt") : (B extends [unknown, ...Units] ? "lt" : "eq");

type DigitCompare<A extends Digit, B extends Digit> =
    Ones<A> extends [...Ones<B>, unknown, ...Units] ? "gt" : Ones<B> extends [...Ones<A>, unknown, ...Units] ? "lt" : "eq";

// Most-significant digit first, the first differing digit decides the order.
type CompareDigits<A extends DigitList, B extends DigitList> =
    A extends [infer Ah extends Digit, ...infer At extends DigitList]
        ? B extends [infer Bh extends Digit, ...infer Bt extends DigitList]
            ? DigitCompare<Ah, Bh> extends "eq" ? CompareDigits<At, Bt> : DigitCompare<Ah, Bh>
            : "gt"
        : "eq";

// More digits means larger; equal digit counts fall through to a digit-by-digit comparison.
type Compare<A extends number, B extends number> =
    Split<`${A}`> extends infer Da extends DigitList
        ? Split<`${B}`> extends infer Db extends DigitList
            ? LenCompare<Da, Db> extends "eq" ? CompareDigits<Da, Db> : LenCompare<Da, Db>
            : never
        : never;

export type Add<A extends number, B extends number> = number extends A | B ? number : FromDigits<AddDigits<ToDigits<A>, ToDigits<B>>>;
export type Mul<A extends number, B extends number> = number extends A | B ? number : FromDigits<MulDigits<ToDigits<A>, ToDigits<B>>>;
// Assumes A >= B >= 0 (the caller's own invariant); a smaller A is not meaningful for unsigned subtraction.
export type Sub<A extends number, B extends number> = number extends A | B ? number : FromDigits<SubDigits<ToDigits<A>, ToDigits<B>>>;
export type Max<A extends number, B extends number> = number extends A | B ? number : Compare<A, B> extends "lt" ? B : A;
export type Min<A extends number, B extends number> = number extends A | B ? number : Compare<A, B> extends "gt" ? B : A;
