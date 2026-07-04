// Type-level text stays raw: entities decode at runtime where the character mapping is available.

import type { AttrList, Content, ElementNode, TextNode, VoidTag } from "./Specification.js";

type Whitespace = " " | "\t" | "\n" | "\r" | "\f";

// A character is a letter exactly when upper- and lower-casing disagree; digits and punctuation map to themselves.
type IsLetter<C extends string> = Uppercase<C> extends Lowercase<C> ? false : true;

type SkipWhitespace<S extends string> = S extends `${Whitespace}${infer Rest}` ? SkipWhitespace<Rest> : S;

type SkipPast<S extends string, Mark extends string> = S extends `${string}${Mark}${infer Rest}` ? Rest : "";

type ReadWord<S extends string, Stop extends string, Acc extends string = ""> =
    S extends `${infer Head}${infer Rest}`
        ? Head extends Stop ? [Acc, S] : ReadWord<Rest, Stop, `${Acc}${Head}`>
        : [Acc, S];

type AttrValue<S extends string> =
    S extends `"${infer Value}"${infer Rest}` ? [Value, Rest]
        : S extends `'${infer Value}'${infer Rest}` ? [Value, Rest]
            : ReadWord<S, Whitespace | ">"> extends [infer Value extends string, infer Rest extends string] ? [Value, Rest] : ["", S];

type OneAttr<S extends string> =
    ReadWord<S, Whitespace | "=" | ">" | "/"> extends [infer Name extends string, infer Rest1 extends string]
        ? SkipWhitespace<Rest1> extends `=${infer Rest2}`
            ? AttrValue<SkipWhitespace<Rest2>> extends [infer Value extends string, infer Rest3 extends string]
                ? [Name, Value, Rest3]
                : never
            : [Name, "", Rest1]
        : never;

type NextAttr<T extends string, Acc extends AttrList> =
    OneAttr<T> extends [infer Name extends string, infer Value extends string, infer Rest extends string]
        ? Attributes<Rest, readonly [...Acc, readonly [Name, Value]]>
        : [Acc, "", false];

// One `|` arm per case: every guard but the matching one collapses to `never`, so the union is that one result.
type Attributes<S extends string, Acc extends AttrList = readonly []> =
    SkipWhitespace<S> extends infer T extends string
        ?
            | (T extends "" ? [Acc, "", false] : never)
            | (T extends `/${infer Rest}` ? [Acc, SkipPast<Rest, ">">, true] : never)
            | (T extends `>${infer Rest}` ? [Acc, Rest, false] : never)
            | (T extends "" | `/${string}` | `>${string}` ? never : NextAttr<T, Acc>)
        : never;

type Lt = TextNode & { readonly value: "<" };

type Closed<Name extends string, A extends AttrList, Rest extends string> = { add: readonly [ElementNode<Name, A, readonly []>], rest: Rest };

type Open<Name extends string, A extends AttrList, Rest extends string> =
    Nodes<Rest> extends { nodes: infer Children extends Content, rest: infer After extends string }
        ? { add: readonly [ElementNode<Name, A, Children>], rest: SkipPast<After, ">"> }
        : never;

// A void tag or a self-closing tag has no children; anything else parses its children until its close tag.
type Element<Name extends string, A extends AttrList, Rest extends string, SelfClosing extends boolean> =
    | (SelfClosing extends true ? Closed<Name, A, Rest> : never)
    | (SelfClosing extends true ? never : Name extends VoidTag ? Closed<Name, A, Rest> : Open<Name, A, Rest>);

type Text<S extends string> =
    ReadWord<S, "<"> extends [infer Value extends string, infer Rest extends string]
        ? { add: readonly [TextNode & { readonly value: Value }], rest: Rest }
        : never;

// After the leading `<`: a letter opens an element, anything else makes the `<` a literal character.
type OpenTag<After extends string> =
    After extends `${infer First}${string}`
        ? IsLetter<First> extends true
            ? ReadWord<After, Whitespace | ">" | "/"> extends [infer Name extends string, infer Rest extends string]
                ? Attributes<Rest> extends [infer A extends AttrList, infer Body extends string, infer SelfClosing extends boolean]
                    ? Element<Name, A, Body, SelfClosing>
                    : never
                : never
            : { add: readonly [Lt], rest: After }
        : { add: readonly [Lt], rest: "" };

// Each arm excludes the more specific ones before it (`<!--` before `<!`, markup before a bare `<`), so the union
// still resolves to exactly one case.
type Node<S extends string> =
    | (S extends `<!--${string}` ? { add: readonly [], rest: SkipPast<S, "-->"> } : never)
    | (S extends `<!--${string}` ? never : S extends `<!${string}` | `<?${string}` ? { add: readonly [], rest: SkipPast<S, ">"> } : never)
    | (S extends `<!${string}` | `<?${string}` ? never : S extends `<${infer After}` ? OpenTag<After> : never)
    | (S extends `<${string}` ? never : Text<S>);

type Nodes<S extends string, Acc extends Content = readonly []> =
    S extends "" ? { nodes: Acc, rest: "" }
        : S extends `</${string}` ? { nodes: Acc, rest: S }
            : Node<S> extends { add: infer Add extends Content, rest: infer Rest extends string }
                ? Nodes<Rest, readonly [...Acc, ...Add]>
                : { nodes: Acc, rest: S };

// At the top level a close tag has no parent to close, so it is skipped as a stray tag, matching the runtime's recovery.
type ParseAll<S extends string, Acc extends Content = readonly []> =
    S extends "" ? Acc
        : Nodes<S> extends { nodes: infer Tree extends Content, rest: infer Rest extends string }
            ? Rest extends `</${string}` ? ParseAll<SkipPast<Rest, ">">, readonly [...Acc, ...Tree]> : readonly [...Acc, ...Tree]
            : Acc;

export type Parse<S extends string> = string extends S ? Content : ParseAll<S>;
