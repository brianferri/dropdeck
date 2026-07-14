import type { ParseError } from "./parse.js";

/**
 * The first rule in the list that is not `false`. The type-level lowerers, serialisers, and renderers list one
 * rule per case, each yielding its result or `false` to defer to the next; this returns the first that matches.
 */
export type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail]
        ? [Head] extends [false]
            ? FirstMatch<Tail>
            : Head
        : false;

/**
 * Turns a dispatch miss into a diagnostic: a hit passes through unchanged, while the miss sentinel becomes a
 * `ParseError<Message>` that names the reason. `Miss` is the value a dispatch yields when nothing matched --
 * `false` by default (the sentinel `FirstMatch` produces), but a caller whose dead-end is `never`, or any other
 * distinct marker, names it instead.
 *
 * The contract is that one declared sentinel: a rule signals "no match" by returning exactly `Miss` -- a single
 * marker a reader and a downstream type can act on -- rather than a bespoke shape per call site. `Miss` must be a
 * distinct value (`false`, `never`, ...), not a wide type like `string`, or real results would read as misses.
 */
export type OrError<Matched, Message extends string, Miss = false> =
    [Matched] extends [Miss] ? ParseError<Message> : Matched;
