// The first rule in the list that is not `false`. The type-level lowerers, serialisers, and renderers list one
// rule per case, each yielding its result or `false` to defer to the next; this returns the first that matches.
export type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;
