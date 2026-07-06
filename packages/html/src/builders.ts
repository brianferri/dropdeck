import type { AttrList, Content, ElementNode, TextNode } from "./Specification.js";

export function element<const Tag extends string, const A extends AttrList, const C extends Content>(
    tag: Tag,
    attrs: A,
    children: C
): ElementNode<Tag, A, C> {
    return { tag, attrs, children };
}

export function text<const S extends string>(value: S): TextNode & { readonly text: S } {
    return { text: value };
}
