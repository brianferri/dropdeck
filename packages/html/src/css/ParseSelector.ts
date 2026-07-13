import type { Combinator, ComplexSelector, SelectorKind, SimpleSelector } from "./Selector.js";
import type { FirstMatch } from "@dropdeck/common";

type Whitespace = " " | "\t" | "\n" | "\r" | "\f";
type TrimStart<S extends string> = S extends `${Whitespace}${infer Rest}` ? TrimStart<Rest> : S;

type NameStop = Whitespace | "." | "#" | "[" | "]" | ":" | ">" | "+" | "~" | "," | "(" | ")" | "*";

type ReadName<S extends string, Acc extends string = ""> =
    S extends `${infer Head}${infer Rest}` ? Head extends NameStop ? [Acc, S] : ReadName<Rest, `${Acc}${Head}`> : [Acc, ""];

type Pop<T extends ReadonlyArray<0>> = T extends readonly [0, ...infer Rest extends ReadonlyArray<0>] ? Rest : readonly [];

type ReadBalanced<S extends string, Open extends string, Close extends string, Acc extends string = "", Depth extends ReadonlyArray<0> = readonly []> =
    S extends `${infer Head}${infer Rest}`
        ? Head extends Open ? ReadBalanced<Rest, Open, Close, `${Acc}${Head}`, readonly [...Depth, 0]>
            : Head extends Close
                ? Depth extends readonly [] ? [Acc, Rest] : ReadBalanced<Rest, Open, Close, `${Acc}${Head}`, Pop<Depth>>
                : ReadBalanced<Rest, Open, Close, `${Acc}${Head}`, Depth>
        : [Acc, ""];

type Simple<Kind extends SelectorKind, Name extends string> = SimpleSelector<Kind, Name>;

type SimpleFrom<Kind extends SelectorKind, Read> = Read extends [infer Name extends string, infer After extends string] ? [Simple<Kind, Name>, After] : false;

type UniversalMatch<S extends string> = S extends `*${infer Rest}` ? [Simple<SelectorKind.Universal, "*">, Rest] : false;
type ClassMatch<S extends string> = S extends `.${infer Rest}` ? SimpleFrom<SelectorKind.Class, ReadName<Rest>> : false;
type IdMatch<S extends string> = S extends `#${infer Rest}` ? SimpleFrom<SelectorKind.Id, ReadName<Rest>> : false;
type AttributeMatch<S extends string> = S extends `[${infer Rest}` ? SimpleFrom<SelectorKind.Attribute, ReadBalanced<Rest, "[", "]">> : false;
type PseudoElementMatch<S extends string> = S extends `::${infer Rest}` ? ReadPseudo<Rest, SelectorKind.PseudoElement> : false;
type PseudoClassMatch<S extends string> = S extends `:${infer Rest}` ? ReadPseudo<Rest, SelectorKind.PseudoClass> : false;
type TypeMatch<S extends string> = ReadName<S> extends [infer Name extends string, infer After extends string] ? Name extends "" ? false : [Simple<SelectorKind.Type, Name>, After] : false;

// The matcher list is ordered so `::` beats `:` and a bare type name is the last resort.
type ReadSimple<S extends string> = FirstMatch<[
    UniversalMatch<S>,
    ClassMatch<S>,
    IdMatch<S>,
    AttributeMatch<S>,
    PseudoElementMatch<S>,
    PseudoClassMatch<S>,
    TypeMatch<S>
]>;

type ReadPseudo<S extends string, Kind extends SelectorKind> =
    ReadName<S> extends [infer Name extends string, infer After extends string]
        ? After extends `(${infer Args}`
            ? ReadBalanced<Args, "(", ")"> extends [infer Inner extends string, infer Rest extends string] ? [Simple<Kind, `${Name}(${Inner})`>, Rest] : false
            : [Simple<Kind, Name>, After]
        : false;

type ReadCompound<S extends string, Acc extends ReadonlyArray<SimpleSelector> = readonly []> =
    ReadSimple<S> extends [infer One extends SimpleSelector, infer Rest extends string] ? ReadCompound<Rest, readonly [...Acc, One]> : [Acc, S];

type ReadCombinator<S extends string> =
    TrimStart<S> extends infer T extends string
        ? T extends `>${infer Rest}` ? [Combinator.Child, TrimStart<Rest>]
            : T extends `+${infer Rest}` ? [Combinator.NextSibling, TrimStart<Rest>]
                : T extends `~${infer Rest}` ? [Combinator.SubsequentSibling, TrimStart<Rest>]
                    : [Combinator.Descendant, T]
        : never;

type ParseComplex<S extends string, Acc extends ComplexSelector = readonly [], Comb extends Combinator = Combinator.Descendant> =
    TrimStart<S> extends infer T extends string
        ? T extends "" ? Acc
            : ReadCompound<T> extends [infer Compound extends ReadonlyArray<SimpleSelector>, infer Rest extends string]
                ? Compound extends readonly [] ? Acc
                    : ReadCombinator<Rest> extends [infer Next extends Combinator, infer After extends string]
                        ? ParseComplex<After, readonly [...Acc, { readonly combinator: Comb, readonly compound: Compound }], Next>
                        : Acc
                : Acc
        : Acc;

export type ParseSelector<S extends string> = string extends S ? ComplexSelector : ParseComplex<S>;
