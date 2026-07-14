import type { ReplaceAll } from "@dropdeck/common";
import type { Attr, AttrList, Content, Element, Node, Text } from "./nodes.js";

// `&` is replaced first so the ampersands introduced by the later entities are not re-escaped.
type EscapeText<S extends string> = ReplaceAll<ReplaceAll<ReplaceAll<S, "&", "&amp;">, "<", "&lt;">, ">", "&gt;">;
type EscapeAttr<S extends string> = ReplaceAll<EscapeText<S>, "\"", "&quot;">;

type SerializeAttrs<A extends AttrList> = A extends readonly [infer Head extends Attr, ...infer Rest extends AttrList]
    ? ` ${Head[0]}="${EscapeAttr<`${Head[1]}`>}"${SerializeAttrs<Rest>}`
    : "";

type SerializeChildren<C extends Content> = C extends readonly [infer Head extends Node, ...infer Rest extends Content]
    ? `${Serialize<Head>}${SerializeChildren<Rest>}`
    : "";

export type Serialize<E extends Node> = E extends Text
    ? EscapeText<E["text"]>
    : E extends Element<infer Tag extends string, infer A extends AttrList, infer C extends Content>
        ? C["length"] extends 0
            ? `<${Tag}${SerializeAttrs<A>}/>`
            : `<${Tag}${SerializeAttrs<A>}>${SerializeChildren<C>}</${Tag}>`
        : never;
