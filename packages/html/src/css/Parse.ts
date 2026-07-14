// A stylesheet *literal* resolves to the exact node tree the runtime builds, so `parse`/`parseStyle` can hand it
// back with a sound cast; a non-literal `string` widens to the general AST.

import type { CssNodeKind, Declaration, Rule, StyleNode, Stylesheet, AtRule } from "./Specification.js";
import type { StripComments, Trim, TrimStart, Whitespace } from "@dropdeck/common";

type MakeDecl<Property extends string, Value extends string, Important extends boolean> = {
    readonly kind: CssNodeKind.Declaration,
    readonly property: Property,
    readonly value: Value,
    readonly important: Important
};

type TakeImportant<Value extends string> =
    Trim<Value> extends `${infer Base} !important` ? [Trim<Base>, true]
        : Trim<Value> extends `${infer Base}!important` ? [Trim<Base>, true]
            : [Trim<Value>, false];

type DeclarationOf<Fragment extends string> =
    Fragment extends `${infer Property}:${infer Value}`
        ? Trim<Property> extends ""
            ? null
            : TakeImportant<Value> extends [infer Resolved extends string, infer Important extends boolean]
                ? MakeDecl<Trim<Property>, Resolved, Important>
                : null
        : null;

type ParseDeclarations<S extends string, Acc extends ReadonlyArray<Declaration> = readonly []> =
    Trim<S> extends "" ? Acc
        : S extends `${infer Head};${infer Rest}`
            ? DeclarationOf<Head> extends infer Decl
                ? Decl extends Declaration ? ParseDeclarations<Rest, readonly [...Acc, Decl]> : ParseDeclarations<Rest, Acc>
                : Acc
            : DeclarationOf<S> extends infer Decl
                ? Decl extends Declaration ? readonly [...Acc, Decl] : Acc
                : Acc;

type ReadPrelude<S extends string, Acc extends string = ""> =
    S extends `${infer Head}${infer Rest}`
        ? Head extends "{" | ";" | "}" ? [Acc, Head, Rest] : ReadPrelude<Rest, `${Acc}${Head}`>
        : [Acc, "", ""];

type Pop<T extends ReadonlyArray<0>> = T extends readonly [0, ...infer Rest extends ReadonlyArray<0>] ? Rest : readonly [];

// Track nested `{}` so an at-rule's inner rules are captured whole, not cut at the first `}`.
type ReadBlock<S extends string, Acc extends string = "", Depth extends ReadonlyArray<0> = readonly []> =
    S extends `${infer Head}${infer Rest}`
        ? Head extends "{" ? ReadBlock<Rest, `${Acc}{`, readonly [...Depth, 0]>
            : Head extends "}"
                ? Depth extends readonly [] ? [Acc, Rest] : ReadBlock<Rest, `${Acc}}`, Pop<Depth>>
                : ReadBlock<Rest, `${Acc}${Head}`, Depth>
        : [Acc, ""];

type SplitSelectors<S extends string, Acc extends ReadonlyArray<string> = readonly []> =
    S extends `${infer Head},${infer Rest}` ? SplitSelectors<Rest, readonly [...Acc, Trim<Head>]> : readonly [...Acc, Trim<S>];

type AtName<S extends string> = S extends `${infer Name}${Whitespace}${infer Prelude}` ? [Name, Trim<Prelude>] : [S, ""];

type MakeBlockNode<Prelude extends string, Body extends string> =
    Trim<Prelude> extends `@${string}`
        ? AtName<Trim<Prelude>> extends [infer Name extends string, infer Pre extends string]
            ? AtRule<Name, Pre, ParseNodes<Body>>
            : never
        : Rule<SplitSelectors<Prelude>, ParseDeclarations<Body>>;

type ParseNodes<S extends string, Acc extends Stylesheet = readonly []> =
    TrimStart<S> extends infer T extends string
        ? T extends "" ? Acc
            : ReadPrelude<T> extends [infer Prelude extends string, infer Stop extends string, infer Rest extends string]
                ? Stop extends "{"
                    ? ReadBlock<Rest> extends [infer Body extends string, infer After extends string]
                        ? ParseNodes<After, readonly [...Acc, MakeBlockNode<Prelude, Body>]>
                        : Acc
                    : Trim<Prelude> extends `@${string}`
                        ? AtName<Trim<Prelude>> extends [infer Name extends string, infer Pre extends string]
                            ? ParseNodes<Rest, readonly [...Acc, AtRule<Name, Pre, null>]>
                            : Acc
                        : DeclarationOf<Prelude> extends infer Decl
                            ? Decl extends Declaration ? ParseNodes<Rest, readonly [...Acc, Decl]> : ParseNodes<Rest, Acc>
                            : Acc
                : Acc
        : Acc;

export type ParseStylesheet<S extends string> = string extends S ? Stylesheet : ParseNodes<StripComments<S>>;

export type ParseStyle<S extends string> = string extends S ? ReadonlyArray<Declaration> : ParseDeclarations<StripComments<S>>;

export type { StyleNode };
