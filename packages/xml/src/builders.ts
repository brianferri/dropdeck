import type { AssertUniqueAttrs, AttrList, Content, Element, Text } from "./typings/nodes.js";

export function element<const Tag extends string, const A extends AttrList, const C extends Content>(
    tag: Tag,
    attrs: A & AssertUniqueAttrs<A>,
    children: C
): Element<Tag, A, C> {
    return { tag, attrs, children };
}

export function text<const S extends string>(value: S): Text & { readonly text: S } {
    return { text: value };
}
