import type { SelectorKind, SimpleSelector } from "./Selector.js";
import type { ParseSelector } from "./ParseSelector.js";
import type { Rule, Stylesheet } from "./Specification.js";

type ClassOfSimple<S> = S extends SimpleSelector<SelectorKind.Class, infer Name> ? Name : never;
type ClassesInCompound<Compound> = Compound extends ReadonlyArray<infer S> ? ClassOfSimple<S> : never;
type ClassesInStep<Step> = Step extends { readonly compound: infer Compound } ? ClassesInCompound<Compound> : never;
type ClassesInSelector<Selector extends string> =
    ParseSelector<Selector> extends ReadonlyArray<infer Step> ? ClassesInStep<Step> : never;
type ClassesInRule<Node> =
    Node extends Rule<infer Selectors, infer _Body>
        ? Selectors extends ReadonlyArray<infer Selector>
            ? Selector extends string ? ClassesInSelector<Selector> : never
            : never
        : never;

export type ClassNames<S extends Stylesheet> = S extends ReadonlyArray<infer Node> ? ClassesInRule<Node> : never;

/**
 * `true` when the classes a view `Uses` and the classes its stylesheet `Defines` are the same set; otherwise a
 * diagnostic string naming the first offender. Assert it with `true satisfies MatchClassNames<...>` so a mismatch
 * is a `tsc` error pinned to that line.
 */
export type MatchClassNames<Uses extends string, Defines extends string> =
    [Exclude<Uses, Defines>] extends [never]
        ? [Exclude<Defines, Uses>] extends [never]
            ? true
            : `unused rule: ".${Extract<Exclude<Defines, Uses>, string>}" is defined but no view uses it`
        : `missing rule: ".${Extract<Exclude<Uses, Defines>, string>}" is used but has no rule`;
