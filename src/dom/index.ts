import { NodeField, element, parse, sanitize, serialize, serializeAll, text } from "@dropdeck/html";
import { serializeStyle } from "@dropdeck/html/css";
import type { DomNode, ElementNode, TextNode } from "@dropdeck/html";
import type { Declaration, MatchesStylesheet, Stylesheet } from "@dropdeck/html/css";

export { parse, sanitize, serialize, serializeAll, text };
export type { DomNode, ElementNode };

export type Child = DomNode | string | ReadonlyArray<DomNode>;

export type Attrs = {
    class?: string,
    id?: string,
    lang?: string,
    charset?: string,
    name?: string,
    content?: string,
    rel?: string,
    type?: string,
    href?: string,
    src?: string,
    alt?: string,
    title?: string,
    accept?: string,
    crossorigin?: boolean,
    multiple?: boolean,
    hidden?: boolean,
    webkitdirectory?: boolean,
    style?: ReadonlyArray<Declaration>,
    data?: Readonly<Record<string, string>>
};

const URL_ATTRS = new Set<string>([
    "src",
    "poster",
    "href"
]);

function attrTuples(attrs: Attrs): Array<readonly [string, string]> {
    const tuples: Array<readonly [string, string]> = [];
    if (attrs.class !== undefined) tuples.push(["class", attrs.class]);
    if (attrs.id !== undefined) tuples.push(["id", attrs.id]);
    if (attrs.lang !== undefined) tuples.push(["lang", attrs.lang]);
    if (attrs.charset !== undefined) tuples.push(["charset", attrs.charset]);
    if (attrs.name !== undefined) tuples.push(["name", attrs.name]);
    if (attrs.content !== undefined) tuples.push(["content", attrs.content]);
    if (attrs.rel !== undefined) tuples.push(["rel", attrs.rel]);
    if (attrs.type !== undefined) tuples.push(["type", attrs.type]);
    if (attrs.href !== undefined) tuples.push(["href", attrs.href]);
    if (attrs.src !== undefined) tuples.push(["src", attrs.src]);
    if (attrs.alt !== undefined) tuples.push(["alt", attrs.alt]);
    if (attrs.title !== undefined) tuples.push(["title", attrs.title]);
    if (attrs.accept !== undefined) tuples.push(["accept", attrs.accept]);
    if (attrs.crossorigin === true) tuples.push(["crossorigin", ""]);
    if (attrs.multiple === true) tuples.push(["multiple", ""]);
    if (attrs.hidden === true) tuples.push(["hidden", ""]);
    if (attrs.webkitdirectory === true) tuples.push(["webkitdirectory", ""]);
    // A bare `style: []` would serialize to an empty attribute, so only emit when there is something to say.
    if (attrs.style !== undefined && attrs.style.length > 0) tuples.push(["style", serializeStyle(attrs.style)]);
    if (attrs.data !== undefined) for (const key of Object.keys(attrs.data)) tuples.push([`data-${key}`, attrs.data[key]]);
    return tuples;
}

function isNodeList(child: DomNode | ReadonlyArray<DomNode>): child is ReadonlyArray<DomNode> {
    return Array.isArray(child);
}

function childNodes(children: ReadonlyArray<Child>): Array<DomNode> {
    const nodes: Array<DomNode> = [];
    for (const child of children) {
        if (typeof child === "string")
            nodes.push(text(child));
        else if (isNodeList(child))
            for (const node of child) nodes.push(node);
        else
            nodes.push(child);
    }
    return nodes;
}

type AttrPair<A, K extends keyof A> =
    A[K] extends string ? readonly [K & string, A[K]]
        : A[K] extends true ? readonly [K & string, ""]
            : never;
type BuiltAttrs<A> = ReadonlyArray<{ [K in keyof A]: AttrPair<A, K> }[keyof A]>;

type BuiltChild<C> =
    C extends string ? readonly [TextNode & { readonly text: C }]
        : C extends ReadonlyArray<DomNode> ? C
            : C extends DomNode ? readonly [C]
                : readonly [];
type BuiltChildren<C> =
    C extends readonly [infer Head, ...infer Tail] ? readonly [...BuiltChild<Head>, ...BuiltChildren<Tail>] : readonly [];

export function el<const Name extends string, const A extends Attrs, const C extends ReadonlyArray<Child>>(
    name: Name,
    attrs: A,
    ...children: C
): ElementNode<Name, BuiltAttrs<A>, BuiltChildren<C>> {
    return element(name, attrTuples(attrs), childNodes(children)) as unknown as ElementNode<Name, BuiltAttrs<A>, BuiltChildren<C>>;
}

function tag<const Name extends string>(name: Name) {
    return <const A extends Attrs, const C extends ReadonlyArray<Child>>(
        attrs: A,
        ...children: C
    ): ElementNode<Name, BuiltAttrs<A>, BuiltChildren<C>> => el(name, attrs, ...children);
}

export const div = tag("div");
export const span = tag("span");
export const p = tag("p");
export const h1 = tag("h1");
export const h2 = tag("h2");
export const h3 = tag("h3");
export const h4 = tag("h4");
export const h5 = tag("h5");
export const h6 = tag("h6");
export const section = tag("section");
export const header = tag("header");
export const footer = tag("footer");
export const nav = tag("nav");
export const ul = tag("ul");
export const ol = tag("ol");
export const li = tag("li");
export const table = tag("table");
export const thead = tag("thead");
export const tbody = tag("tbody");
export const tr = tag("tr");
export const th = tag("th");
export const td = tag("td");
export const a = tag("a");
export const em = tag("em");
export const strong = tag("strong");
export const blockquote = tag("blockquote");
export const hr = tag("hr");
export const br = tag("br");
export const img = tag("img");
export const input = tag("input");
export const textarea = tag("textarea");
export const pre = tag("pre");
export const code = tag("code");
export const button = tag("button");
export const canvas = tag("canvas");
export const html = tag("html");
export const head = tag("head");
export const body = tag("body");
export const meta = tag("meta");
export const title = tag("title");
export const style = tag("style");
export const script = tag("script");
export const link = tag("link");

// Only element attributes are remapped, so a URL written as text in a code sample stays verbatim -- a string
// replace over the rendered HTML could not tell the two apart.
export function mapUrlAttrs(
    nodes: ReadonlyArray<DomNode>,
    assets: ReadonlyMap<string, string>
): Array<DomNode> {
    return nodes.map((node) => {
        if (NodeField.Text in node) return node;
        const attrs = node.attrs.map((attr) => (URL_ATTRS.has(attr[0].toLowerCase()) ? [attr[0], assets.get(attr[1]) ?? attr[1]] as const : attr));
        return element(node.tag, attrs, mapUrlAttrs(node.children, assets));
    });
}

type ValidStylesheet<Tree, Css extends Stylesheet, Runtime extends string> =
    MatchesStylesheet<Tree, Css, Runtime> extends true ? unknown : MatchesStylesheet<Tree, Css, Runtime>;

/** `runtime` is the only escape hatch: classes toggled at run time, the only ones the markup may omit without failing the type-check. */
export function styled<const Tree extends DomNode, const Css extends Stylesheet, const Runtime extends ReadonlyArray<string> = readonly []>(
    tree: Tree,
    css: Css & ValidStylesheet<Tree, NoInfer<Css>, Runtime[number]>,
    runtime: Runtime = [] as ReadonlyArray<string> as Runtime
): { readonly tree: Tree, readonly css: Css, readonly runtime: Runtime } {
    return { tree, css, runtime };
}

export function cx(...tokens: ReadonlyArray<string | false | undefined>): string {
    const present: Array<string> = [];
    for (const token of tokens) if (typeof token === "string" && token.length > 0) present.push(token);
    return present.join(" ");
}
