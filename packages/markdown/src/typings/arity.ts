import type { Content, Node } from "./nodes.js";

// Arity combinators -- the house algebra for content models, the only sanctioned type-level spread use.
export type Empty = readonly [];
export type One<T extends Node> = readonly [T];
export type Opt<T extends Node> = readonly [] | readonly [T];
export type Many<T extends Node> = ReadonlyArray<T>;
export type Some<T extends Node> = readonly [T, ...ReadonlyArray<T>];
export type Seq<A extends Content, B extends Content> = readonly [...A, ...B];
