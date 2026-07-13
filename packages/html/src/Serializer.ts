import { escapeAttribute, escapeText } from "./Entities.js";
import { ESCAPABLE_RAW_TEXT_TAGS, NodeField, RAW_TEXT_TAGS, VOID_TAGS } from "./Specification.js";
import type { Attr, DomNode } from "./typings/nodes.js";
import type { Serialize } from "./typings/serialize.js";

const VOID = new Set<string>(VOID_TAGS);

// Raw-text elements that do not decode entities (`script`, `style`) hold their content verbatim: escaping a `<`
// inside a script would corrupt it, and the parser already keeps the text raw, so escaping here breaks round-trip.
const ESCAPABLE_RAW = new Set<string>(ESCAPABLE_RAW_TEXT_TAGS);
const RAW_VERBATIM = new Set<string>(RAW_TEXT_TAGS.filter((tag) => !ESCAPABLE_RAW.has(tag)));

function attribute(attr: Attr): string {
    const [name, value] = attr;
    if (value === "") return ` ${name}`;
    return ` ${name}="${escapeAttribute(value)}"`;
}

function render(node: DomNode): string {
    if (NodeField.Text in node) return escapeText(node.text);
    let out = `<${node.tag}`;
    for (const attr of node.attrs) out += attribute(attr);
    out += ">";
    if (VOID.has(node.tag)) return out;
    if (RAW_VERBATIM.has(node.tag)) {
        for (const child of node.children) out += rawChild(child);
        return `${out}</${node.tag}>`;
    }
    for (const child of node.children) out += render(child);
    return `${out}</${node.tag}>`;
}

// The spec says a raw-text element holds only text, but recurse defensively in case a builder placed an element child inside.
function rawChild(node: DomNode): string {
    return NodeField.Text in node ? node.text : render(node);
}

// The cast is sound because `render` produces the exact markup literal `Serialize<N>` computes, by construction.
export function serialize<const N extends DomNode>(node: N): Serialize<N> {
    return render(node) as Serialize<N>;
}

export function serializeAll(nodes: ReadonlyArray<DomNode>): string {
    let out = "";
    for (const node of nodes) out += render(node);
    return out;
}
