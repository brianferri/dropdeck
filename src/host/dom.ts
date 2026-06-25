import { serialize as serializeCss } from "@dropdeck/html/css";
import type { HtmlTag } from "@dropdeck/html";
import type { Stylesheet } from "@dropdeck/html/css";

export function requireElement<T extends HTMLElement = HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error(`dropdeck: missing #${id}`);
    return node as T;
}

type SelectorTag<S extends string> =
    S extends `${infer Tag}${"." | "#" | "[" | ":" | " " | ">" | "+" | "~" | ","}${string}` ? Tag : S;

type QueryResult<S extends string> =
    SelectorTag<S> extends HtmlTag & keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[SelectorTag<S>] : HTMLElement;

// Sharpening the result from the selector's leading tag means no annotation at the call site and no assertion here.
export function query<const S extends string>(root: ParentNode, selector: S): QueryResult<S> | null {
    return root.querySelector(selector);
}

export function activeElement(): Element | null {
    return document.activeElement;
}

export function setRootProperty<const Name extends `--${string}`>(name: Name, value: string): void {
    document.documentElement.style.setProperty(name, value);
}

export function mountStyle(id: string, css: Stylesheet): void {
    if (document.getElementById(id)) return;
    const element = document.createElement("style");
    element.id = id;
    element.textContent = serializeCss(css);
    document.head.prepend(element);
}
