import type { Repeat } from "./number.js";

export type DigitChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type Whitespace = " " | "\n" | "\t" | "\r" | "\f";

export type LowerLetter =
    | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
    | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
export type UpperLetter =
    | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
    | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
export type AlphaChar = LowerLetter | UpperLetter;
export type HexDigit = DigitChar | "a" | "b" | "c" | "d" | "e" | "f" | "A" | "B" | "C" | "D" | "E" | "F";

/** A character is a letter exactly when upper- and lower-casing disagree; digits and punctuation map to themselves. */
export type IsLetter<C extends string> = Uppercase<C> extends Lowercase<C> ? false : true;

/**
 * True IFF `Source` is exactly as many `HexDigit` characters as `Count` has elements. `Count` is a length-tuple
 * (e.g. `Repeat<0, 6>`); a per-character walk is the only way to pin a fixed length without a union that a wide
 * hex group would blow up to (22^n members).
 */
export type HexRun<Source extends string, Count extends ReadonlyArray<0>> =
    Count extends readonly [0, ...infer Rest extends ReadonlyArray<0>]
        ? Source extends `${HexDigit}${infer Tail}` ? HexRun<Tail, Rest> : false
        : Source extends "" ? true : false;

/** Maps each member of a string enum to its own spelling, so a scanned run indexes straight to the member. */
export type BySpelling<Member extends string> = { [Value in Member as `${Value}`]: Value };

/** Re-keys a table by the string spelling of its keys, so an enum-keyed table indexes by a plain string literal. */
export type ByName<Table> = { [Key in keyof Table as `${Extract<Key, string>}`]: Table[Key] };

/** Maps an attribute table to the union of its `[name, value]` tuples, dropping the optional-ness of each value. */
export type AttrOf<Table> = { [Key in keyof Table & string]: readonly [Key, NonNullable<Table[Key]>] }[keyof Table & string];

/** Consumes the leading run of characters in `Class`, returning that run and the untouched remainder. */
export type TakeRun<Source extends string, Class extends string, Acc extends string = ""> =
    Source extends `${infer Head}${infer Rest}`
        ? Head extends Class ? TakeRun<Rest, Class, `${Acc}${Head}`> : { run: Acc, rest: Source }
        : { run: Acc, rest: Source };

/**
 * Consumes the leading run of characters NOT in `Stop`, halting at the first `Stop` character. `Consume` decides
 * whether that terminator is dropped from the remainder (e.g. a closing quote) or left for the caller to see.
 */
export type TakeUntil<Source extends string, Stop extends string, Consume extends boolean = false, Acc extends string = ""> =
    Source extends `${infer Head}${infer Rest}`
        ? Head extends Stop
            ? { run: Acc, rest: Consume extends true ? Rest : Source }
            : TakeUntil<Rest, Stop, Consume, `${Acc}${Head}`>
        : { run: Acc, rest: Source };

/** Consumes up to and including the first `End` character, which is dropped. */
export type TakeThrough<Source extends string, End extends string> = TakeUntil<Source, End, true>;

/** Parses a fully-numeric run into its `number` literal; yields `Miss` (default `never`) when the run is not a number. */
export type NumberOf<Run extends string, Miss = never> = Run extends `${infer Value extends number}` ? Value : Miss;

/**
 * Scans a leading numeric run, integer or decimal. A dot with no following digit (`3.`) keeps just the integer
 * and leaves the dot, so it is not swallowed into a malformed number.
 */
export type TakeNumber<Source extends string> =
    TakeRun<Source, DigitChar> extends { run: infer Integer extends string, rest: infer Rest extends string }
        ? Rest extends `.${infer Tail extends string}`
            ? TakeRun<Tail, DigitChar> extends { run: infer Fraction extends string, rest: infer After extends string }
                ? Fraction extends "" ? { run: Integer, rest: Rest } : { run: `${Integer}.${Fraction}`, rest: After }
                : never
            : { run: Integer, rest: Rest }
        : never;

/** One tokenizer step: the tokens produced and the source left to scan. */
export type Step<Produced extends ReadonlyArray<unknown>, Rest extends string> = { produced: Produced, rest: Rest };

// A char is consumed per element of the length-tuple, so widths are counted down as tuples internally while the
// public types speak in plain numbers.
type LeadRun<Source extends string, Class extends string, Width extends ReadonlyArray<unknown>, Run extends string = ""> =
    Width extends readonly [unknown, ...infer Rest extends ReadonlyArray<unknown>]
        ? Source extends `${infer Head}${infer Tail}` ? LeadRun<Tail, Class, Rest, `${Run}${Head}`> : false
        : Run extends Class ? { head: Run, rest: Source } : false;

/**
 * The leading `Width` characters if that run belongs to `Class`, split from the rest; `false` when the source is too
 * short or the run is outside `Class`.
 */
export type LeadN<Source extends string, Class extends string, Width extends number> =
    LeadRun<Source, Class, Repeat<unknown, Width>>;

type LongestRun<Source extends string, Table, Width extends ReadonlyArray<unknown>> =
    Width extends readonly [unknown, ...infer Narrower extends ReadonlyArray<unknown>]
        ? LeadRun<Source, keyof Table & string, Width> extends { head: infer Head extends keyof Table, rest: infer Rest extends string }
            ? Step<[Table[Head]], Rest>
            : LongestRun<Source, Table, Narrower>
        : false;

/**
 * The longest leading run (up to `Width` characters) that keys `Table`, emitted as that one token with the rest left.
 * Widest first, so a table holding both `===` and `==` matches `===`; `false` when no leading run keys the table.
 */
export type LongestRule<Source extends string, Table, Width extends number> =
    LongestRun<Source, Table, Repeat<unknown, Width>>;
