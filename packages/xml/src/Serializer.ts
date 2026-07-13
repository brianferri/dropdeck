import type { Attr, Node, Text } from "./typings/nodes.js";
import type { Serialize } from "./typings/serialize.js";

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
