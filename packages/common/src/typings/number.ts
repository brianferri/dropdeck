/** A tuple of `Count` copies of `T` -- the Peano counter behind length-based numeric comparison. */
export type Repeat<T, Count extends number, Acc extends ReadonlyArray<T> = []> =
    Acc["length"] extends Count ? Acc : Repeat<T, Count, [...Acc, T]>;

/** `A <= B` on non-negative integer literals: B's length-tuple starts with A's. */
export type LessOrEqual<A extends number, B extends number> =
    Repeat<unknown, B> extends [...Repeat<unknown, A>, ...ReadonlyArray<unknown>] ? true : false;

/** `A < B` on non-negative integer literals: B's length-tuple has at least one element past A's. */
export type LessThan<A extends number, B extends number> =
    Repeat<unknown, B> extends [...Repeat<unknown, A>, unknown, ...ReadonlyArray<unknown>] ? true : false;

/** Boolean negation. */
export type Negate<Flag extends boolean> = Flag extends true ? false : true;
