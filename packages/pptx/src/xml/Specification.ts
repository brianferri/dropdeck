/* eslint-disable @typescript-eslint/naming-convention -- ST_* mirror the ECMA-376 schema names verbatim, and namespace prefixes are lower-case by spec. */

export enum Namespace {
    a = "http://schemas.openxmlformats.org/drawingml/2006/main",
    p = "http://schemas.openxmlformats.org/presentationml/2006/main",
    r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    ct = "http://schemas.openxmlformats.org/package/2006/content-types",
    rel = "http://schemas.openxmlformats.org/package/2006/relationships"
}

export const NamespaceByPrefix = {
    a: Namespace.a,
    p: Namespace.p,
    r: Namespace.r,
    ct: Namespace.ct,
    rel: Namespace.rel
} as const satisfies Record<string, Namespace>;

export type Prefix = keyof typeof NamespaceByPrefix;
export type QName<P extends Prefix, Local extends string> = `${P}:${Local}`;
export type ParseQName<Q extends string> = Q extends `${infer P}:${infer Local}` ? { readonly prefix: P, readonly local: Local } : never;

export type ST_String = string;
export type ST_Boolean = boolean;

export type AttrScalar = string | number | boolean;
export type Attr<Name extends string = string, Value extends AttrScalar = AttrScalar> = readonly [Name, Value];
export type AttrList = ReadonlyArray<Attr>;

type DuplicateAttrName<T extends AttrList, Seen = never> =
    T extends readonly [infer Head extends Attr, ...infer Rest extends AttrList]
        ? Head[0] extends Seen
            ? Head[0]
            : DuplicateAttrName<Rest, Seen | Head[0]>
        : never;

// Intersected with the input at a construction site, a duplicate name collapses the parameter to `never`, so the call fails to compile.
export type AssertUniqueAttrs<T extends AttrList> =
    [DuplicateAttrName<T>] extends [never] ? T : `duplicate attribute "${DuplicateAttrName<T> & string}"`;

export type Text = { readonly text: string };
export type Element<
    Tag extends string = string,
    Attributes extends AttrList = AttrList,
    Children extends Content = Content
> = {
    readonly tag: Tag,
    readonly attrs: Attributes,
    readonly children: Children
};
export type Node = Element | Text;
export type Content = ReadonlyArray<Node>;

export type Empty = readonly [];
export type One<T extends Node> = readonly [T];
export type Opt<T extends Node> = readonly [] | readonly [T];
export type Many<T extends Node> = ReadonlyArray<T>;
export type Some<T extends Node> = readonly [T, ...ReadonlyArray<T>];
export type Seq<A extends Content, B extends Content> = readonly [...A, ...B];

export type ReqAttr<Name extends string, Value extends AttrScalar> = readonly [Attr<Name, Value>];
export type OptAttr<Name extends string, Value extends AttrScalar> = readonly [] | readonly [Attr<Name, Value>];
export type AttrSeq<A extends AttrList, B extends AttrList> = readonly [...A, ...B];

/* eslint-enable @typescript-eslint/naming-convention */
