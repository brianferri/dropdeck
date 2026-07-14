export type Empty = readonly [];
export type One<T> = readonly [T];
export type Opt<T> = readonly [] | readonly [T];
export type Many<T> = ReadonlyArray<T>;
export type Some<T> = readonly [T, ...ReadonlyArray<T>];
export type Seq<A extends ReadonlyArray<unknown>, B extends ReadonlyArray<unknown>> = readonly [...A, ...B];
