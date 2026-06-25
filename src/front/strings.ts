type Whitespace = " " | "\t" | "\n" | "\r" | "\f";

export type TrimStart<S extends string> = S extends `${Whitespace}${infer Rest}` ? TrimStart<Rest> : S;
export type TrimEnd<S extends string> = S extends `${infer Rest}${Whitespace}` ? TrimEnd<Rest> : S;
export type Trim<S extends string> = TrimStart<TrimEnd<S>>;

export type SplitOn<S extends string, Delim extends string, Acc extends Array<string> = []> =
    S extends `${infer Head}${Delim}${infer Tail}` ? SplitOn<Tail, Delim, [...Acc, Head]> : [...Acc, S];

export type Contains<S extends string, Sub extends string> = S extends `${string}${Sub}${string}` ? true : false;

export type Normalize<S extends string> = S extends `${infer Head}\r\n${infer Tail}` ? `${Head}\n${Normalize<Tail>}` : S;

export type Repeat<T, Count extends number, Acc extends Array<T> = []> =
    Acc["length"] extends Count ? Acc : Repeat<T, Count, [...Acc, T]>;

export type Cell<P extends Array<string>, Index extends number> =
    P extends [...Repeat<string, Index>, infer A extends string, ...Array<string>] ? A : "";

export type FromEntries<Entries extends Array<readonly [string, unknown]>> = {
    [Entry in Entries[number] as Entry[0]]: Entry[1]
};
