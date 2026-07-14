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

/** The leading character if it belongs to `Class`, split from the rest -- the shared shape of the single-char rules. */
export type Lead<Source extends string, Class extends string> =
    Source extends `${infer Head}${infer Rest}` ? Head extends Class ? { head: Head, rest: Rest } : false : false;

/** A single-character token rule: the leading char, if a key of `Table`, becomes that one token; the rest is left. */
export type SingleRule<Source extends string, Table> =
    Lead<Source, keyof Table & string> extends { head: infer Head extends keyof Table, rest: infer Rest extends string }
        ? Step<[Table[Head]], Rest>
        : false;

/** The leading two characters if that pair belongs to `Class`, split from the rest -- `Lead` a pair wide. */
export type Lead2<Source extends string, Class extends string> =
    Source extends `${infer A}${infer B}${infer Rest}` ? `${A}${B}` extends Class ? { head: `${A}${B}`, rest: Rest } : false : false;

/** A two-character token rule: the leading pair, if a key of `Table`, becomes that one token; the rest is left. */
export type DoubleRule<Source extends string, Table> =
    Lead2<Source, keyof Table & string> extends { head: infer Head extends keyof Table, rest: infer Rest extends string }
        ? Step<[Table[Head]], Rest>
        : false;
