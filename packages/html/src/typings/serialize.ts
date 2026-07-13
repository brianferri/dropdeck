import type { Attr, AttrList, Content, DomNode, ElementNode, EscapableRawTextTag, RawTextTag, TextNode, VoidTag } from "./nodes.js";

type ReplaceAll<S extends string, From extends string, To extends string> = S extends `${infer Head}${From}${infer Tail}` ? `${Head}${To}${ReplaceAll<Tail, From, To>}` : S;

// `&` is replaced first so the ampersands the later entities introduce are not re-escaped -- the same order the
// runtime `escapeText` relies on.
type EscapeTextType<S extends string> = ReplaceAll<ReplaceAll<ReplaceAll<S, "&", "&amp;">, "<", "&lt;">, ">", "&gt;">;
type EscapeAttrType<S extends string> = ReplaceAll<EscapeTextType<S>, "\"", "&quot;">;

type SerializeAttrs<A extends AttrList> = A extends readonly [infer Head extends Attr, ...infer Rest extends AttrList]
    ? Head[1] extends ""
        ? ` ${Head[0]}${SerializeAttrs<Rest>}`
        : ` ${Head[0]}="${EscapeAttrType<Head[1]>}"${SerializeAttrs<Rest>}`
    : "";

type SerializeChildren<C extends Content> = C extends readonly [infer Head extends DomNode, ...infer Rest extends Content]
    ? `${Serialize<Head>}${SerializeChildren<Rest>}`
    : "";

type RawVerbatimTag = Exclude<RawTextTag, EscapableRawTextTag>;
type SerializeRawChildren<C extends Content> = C extends readonly [infer Head extends DomNode, ...infer Rest extends Content]
    ? `${Head extends TextNode ? Head["text"] : Serialize<Head>}${SerializeRawChildren<Rest>}`
    : "";

export type Serialize<N extends DomNode> = N extends TextNode
    ? EscapeTextType<N["text"]>
    : N extends ElementNode<infer Tag extends string, infer A extends AttrList, infer C extends Content>
        ? Tag extends VoidTag
            ? `<${Tag}${SerializeAttrs<A>}>`
            : Tag extends RawVerbatimTag
                ? `<${Tag}${SerializeAttrs<A>}>${SerializeRawChildren<C>}</${Tag}>`
                : `<${Tag}${SerializeAttrs<A>}>${SerializeChildren<C>}</${Tag}>`
        : never;
