import type { Repeat } from "@dropdeck/common";

export type { Repeat };
export type { Contains, Normalize, SplitOn, Trim, TrimEnd, TrimStart } from "@dropdeck/common";

export type Cell<P extends Array<string>, Index extends number> =
    P extends [...Repeat<string, Index>, infer A extends string, ...Array<string>] ? A : "";

export type FromEntries<Entries extends Array<readonly [string, unknown]>> = {
    [Entry in Entries[number] as Entry[0]]: Entry[1]
};
