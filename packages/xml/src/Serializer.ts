import type { Attr, AttrList, Content, Element, Node, Text } from "./Specification.js";

type ReplaceAll<S extends string, From extends string, To extends string> = S extends `${infer Head}${From}${infer Tail}` ? `${Head}${To}${ReplaceAll<Tail, From, To>}` : S;

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

function isText(node: Node): node is Text {
    return "text" in node;
}

function escapeText(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
    return escapeText(value).replace(/"/g, "&quot;");
}

export function xml<const E extends Node>(node: E): Serialize<E> {
    if (isText(node)) return escapeText(node.text) as Serialize<E>;
    let out = `<${node.tag}`;
    for (const attr of node.attrs) out += attribute(attr);
    if (node.children.length === 0) return `${out}/>` as Serialize<E>;
    out += ">";
    for (const child of node.children) out += xml(child);
    return `${out}</${node.tag}>` as Serialize<E>;
}

function attribute(attr: Attr): string {
    const [name, value] = attr;
    return ` ${name}="${escapeAttr(String(value))}"`;
}
