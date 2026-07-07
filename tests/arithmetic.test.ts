import { test, expect } from "vitest";
import type { Add, Max, Min, Mul, Sub } from "#/typings/arithmetic";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// The real test: each entry fails to compile if the digit-wise arithmetic is wrong. `tsc` checks it.
export type Assertions = [
    Expect<Equal<Add<0, 0>, 0>>,
    Expect<Equal<Add<12, 34>, 46>>,
    Expect<Equal<Add<99, 1>, 100>>,
    Expect<Equal<Add<9999, 1>, 10000>>,
    Expect<Equal<Mul<0, 9525>, 0>>,
    Expect<Equal<Mul<20, 85>, 1700>>,
    Expect<Equal<Mul<1, 9525>, 9525>>,
    Expect<Equal<Mul<48, 9525>, 457200>>,
    // The full slide width -- eight digits, well past TypeScript's tuple-length ceiling.
    Expect<Equal<Mul<1280, 9525>, 12192000>>,
    Expect<Equal<Sub<100, 37>, 63>>,
    Expect<Equal<Sub<1000, 1>, 999>>,
    Expect<Equal<Max<3, 4>, 4>>,
    Expect<Equal<Max<12, 9>, 12>>,
    Expect<Equal<Max<7, 7>, 7>>,
    Expect<Equal<Min<3, 4>, 3>>,
    Expect<Equal<Min<120, 90>, 90>>,
    Expect<Equal<Min<0, 5>, 0>>,
    // A non-literal operand degrades to `number` rather than erroring.
    Expect<Equal<Mul<number, 9525>, number>>,
    Expect<Equal<Max<number, 5>, number>>
];

// A dummy: the arithmetic is purely type-level, so there is nothing to assert at runtime. It exists only because
// vitest requires at least one runtime test per file; the `Assertions` above are what actually gets checked.
test("arithmetic types compile", () => {
    expect(true).toBe(true);
});
