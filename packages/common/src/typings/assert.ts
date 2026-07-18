// `Equal` decides exact type identity (not mutual assignability), so a proof rejects a subtype that merely fits.
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// A compile-time assertion: instantiate `Expect<SomeCheck>` and the build fails unless `SomeCheck` resolves to `true`.
export type Expect<Passes extends true> = Passes;

// `SameSet` decides whether two unions denote the same members (each assignable to the other), where `Equal` would
// reject them -- e.g. a bare enum type is not seen as identical to the `keyof` union of a table keyed by its members.
export type SameSet<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
