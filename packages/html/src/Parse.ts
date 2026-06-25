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
                ? [Lowercase<Name>, Value, Rest3]
                : never
            : [Lowercase<Name>, "", Rest1]
        : never;

type Attributes<S extends string, Acc extends AttrList = readonly []> =
    SkipWhitespace<S> extends infer Trimmed extends string
        ? Trimmed extends `/>${infer Rest}` ? [Acc, Rest, true]
            : Trimmed extends `/${infer Rest}` ? [Acc, SkipPast<Rest, ">">, true]
                : Trimmed extends `>${infer Rest}` ? [Acc, Rest, false]
                    : Trimmed extends "" ? [Acc, "", false]
                        : OneAttr<Trimmed> extends [infer Name extends string, infer Value extends string, infer Rest extends string]
                            ? Attributes<Rest, readonly [...Acc, readonly [Name, Value]]>
                            : [Acc, "", false]
        : never;

type Lt = TextNode & { readonly value: "<" };

type Element<Name extends string, A extends AttrList, Rest extends string, SelfClosing extends boolean> =
    SelfClosing extends true ? { add: readonly [ElementNode<Name, A, readonly []>], rest: Rest }
        : Name extends VoidTag ? { add: readonly [ElementNode<Name, A, readonly []>], rest: Rest }
            : Nodes<Rest> extends { nodes: infer Children extends Content, rest: infer After extends string }
                ? { add: readonly [ElementNode<Name, A, Children>], rest: SkipPast<After, ">"> }
                : never;

type Node<S extends string> =
    S extends `<!--${string}` ? { add: readonly [], rest: SkipPast<S, "-->"> }
        : S extends `<!${string}` ? { add: readonly [], rest: SkipPast<S, ">"> }
            : S extends `<?${string}` ? { add: readonly [], rest: SkipPast<S, ">"> }
                : S extends `<${infer After}`
                    ? After extends `${infer First}${string}`
                        ? IsLetter<First> extends true
                            ? ReadWord<After, Whitespace | ">" | "/"> extends [infer Name extends string, infer Rest extends string]
                                ? Attributes<Rest> extends [infer A extends AttrList, infer Body extends string, infer SelfClosing extends boolean]
                                    ? Element<Lowercase<Name>, A, Body, SelfClosing>
                                    : never
                                : never
                            : { add: readonly [Lt], rest: After }
                        : { add: readonly [Lt], rest: "" }
                    : ReadWord<S, "<"> extends [infer Value extends string, infer Rest extends string]
                        ? { add: readonly [TextNode & { readonly value: Value }], rest: Rest }
                        : never;

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
