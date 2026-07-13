export type DigitChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type Whitespace = " " | "\n" | "\t" | "\r";

// Maps each member of a string enum to its own spelling, so a scanned run indexes straight to the member.
export type BySpelling<Member extends string> = { [Value in Member as `${Value}`]: Value };

// Consumes the leading run of characters in `Class`, returning that run and the untouched remainder.
export type TakeRun<Source extends string, Class extends string, Acc extends string = ""> =
    Source extends `${infer Head}${infer Rest}`
        ? Head extends Class ? TakeRun<Rest, Class, `${Acc}${Head}`> : { run: Acc, rest: Source }
        : { run: Acc, rest: Source };

export type NumberOf<Run extends string> = Run extends `${infer Value extends number}` ? Value : never;

// Scans a leading numeric run, integer or decimal. A dot with no following digit (`3.`) keeps just the integer
// and leaves the dot, so it is not swallowed into a malformed number.
export type TakeNumber<Source extends string> =
    TakeRun<Source, DigitChar> extends { run: infer Integer extends string, rest: infer Rest extends string }
        ? Rest extends `.${infer Tail extends string}`
            ? TakeRun<Tail, DigitChar> extends { run: infer Fraction extends string, rest: infer After extends string }
                ? Fraction extends "" ? { run: Integer, rest: Rest } : { run: `${Integer}.${Fraction}`, rest: After }
                : never
            : { run: Integer, rest: Rest }
        : never;

// One tokenizer step: the tokens produced and the source left to scan.
export type Step<Produced extends ReadonlyArray<unknown>, Rest extends string> = { produced: Produced, rest: Rest };

// The leading character if it belongs to `Class`, split from the rest -- the shared shape of the single-char rules.
export type Lead<Source extends string, Class extends string> =
    Source extends `${infer Head}${infer Rest}` ? Head extends Class ? { head: Head, rest: Rest } : false : false;

// A single-character token rule: the leading char, if a key of `Table`, becomes that one token; the rest is left.
export type SingleRule<Source extends string, Table> =
    Lead<Source, keyof Table & string> extends { head: infer Head extends keyof Table, rest: infer Rest extends string }
        ? Step<[Table[Head]], Rest>
        : false;

// The leading two characters if that pair belongs to `Class`, split from the rest -- `Lead` a pair wide.
export type Lead2<Source extends string, Class extends string> =
    Source extends `${infer A}${infer B}${infer Rest}` ? `${A}${B}` extends Class ? { head: `${A}${B}`, rest: Rest } : false : false;

// A two-character token rule: the leading pair, if a key of `Table`, becomes that one token; the rest is left.
export type DoubleRule<Source extends string, Table> =
    Lead2<Source, keyof Table & string> extends { head: infer Head extends keyof Table, rest: infer Rest extends string }
        ? Step<[Table[Head]], Rest>
        : false;
