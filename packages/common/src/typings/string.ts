import type { Whitespace } from "./lex.js";

/** Drops the leading run of `Class` characters (whitespace by default); doubles as "skip a leading run". */
export type TrimStart<S extends string, Class extends string = Whitespace> =
    S extends `${Class}${infer Rest}` ? TrimStart<Rest, Class> : S;

/** Drops the trailing run of `Class` characters (whitespace by default). */
export type TrimEnd<S extends string, Class extends string = Whitespace> =
    S extends `${infer Rest}${Class}` ? TrimEnd<Rest, Class> : S;

/** Drops leading and trailing runs of `Class`. */
export type Trim<S extends string, Class extends string = Whitespace> = TrimEnd<TrimStart<S, Class>, Class>;

/** Removes every C-style block comment from `S`. */
export type StripComments<S extends string> =
    S extends `${infer Head}/*${string}*/${infer Tail}` ? StripComments<`${Head}${Tail}`> : S;

/** Replaces every occurrence of `From` with `To`. `To` is not rescanned, so a `To` that contains `From` is safe. */
export type ReplaceAll<S extends string, From extends string, To extends string> =
    S extends `${infer Head}${From}${infer Tail}` ? `${Head}${To}${ReplaceAll<Tail, From, To>}` : S;

/** The remainder after the first occurrence of `Mark`, or `""` when `Mark` is absent. */
export type SkipPast<S extends string, Mark extends string> = S extends `${string}${Mark}${infer Rest}` ? Rest : "";

/** Rewrites CRLF line endings to LF. */
export type Normalize<S extends string> = ReplaceAll<S, "\r\n", "\n">;

/** Whether `Sub` occurs anywhere in `S`. */
export type Contains<S extends string, Sub extends string> = S extends `${string}${Sub}${string}` ? true : false;

/** True IFF every character of `S` belongs to `Class` (vacuously true for the empty string). */
export type AllChars<S extends string, Class extends string> =
    S extends "" ? true : S extends `${Class}${infer Rest}` ? AllChars<Rest, Class> : false;

/** Splits `S` on each occurrence of `Delim`, yielding the segments in order. */
export type SplitOn<S extends string, Delim extends string, Acc extends Array<string> = []> =
    S extends `${infer Head}${Delim}${infer Tail}` ? SplitOn<Tail, Delim, [...Acc, Head]> : [...Acc, S];
