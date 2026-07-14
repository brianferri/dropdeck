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

export type { Empty, Many, One, Opt, Seq, Some } from "@dropdeck/common";

export type ReqAttr<Name extends string, Value extends AttrScalar> = readonly [Attr<Name, Value>];
export type OptAttr<Name extends string, Value extends AttrScalar> = readonly [] | readonly [Attr<Name, Value>];
export type AttrSeq<A extends AttrList, B extends AttrList> = readonly [...A, ...B];
