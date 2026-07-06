import { isWhitespace } from "./Characters.js";
import { NodeField } from "./Specification.js";
import type { Content, DomNode, ElementNode } from "./Specification.js";

export function attribute(element: ElementNode, name: string): string | null {
    for (const [key, value] of element.attrs) if (key === name) return value;
    return null;
}

export function hasClass(element: ElementNode, token: string): boolean {
    const list = attribute(element, "class");
    if (list === null) return false;
    let start = 0;
    for (let index = 0; index <= list.length; index += 1) {
        const atBoundary = index === list.length || isWhitespace(list.charAt(index));
        if (!atBoundary) continue;
        if (index > start && list.slice(start, index) === token) return true;
        start = index + 1;
    }
    return false;
}

export function childElements(element: ElementNode): Array<ElementNode> {
    const out: Array<ElementNode> = [];
    for (const child of element.children) if (NodeField.Tag in child) out.push(child);
    return out;
}

function pushReversed(stack: Array<DomNode>, nodes: Content): void {
    for (let index = nodes.length - 1; index >= 0; index -= 1) stack.push(nodes[index]);
}

function hasTag<Tag extends string>(node: ElementNode, tag: Tag): node is ElementNode<Tag> {
    return node.tag === tag;
}

// Children are pushed reversed so the stack pops them back in document order.
export function textContent(node: DomNode): string {
    let out = "";
    const stack: Array<DomNode> = [node];
    while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) break;
        if (NodeField.Text in current) out += current.text;
        else pushReversed(stack, current.children);
    }
    return out;
}

export function findAll<const Tag extends string>(roots: Content, tag: Tag): Array<ElementNode<Tag>> {
    const out: Array<ElementNode<Tag>> = [];
    const stack: Array<DomNode> = [];
    pushReversed(stack, roots);
    while (stack.length > 0) {
        const node = stack.pop();
        if (node === undefined) break;
        if (!(NodeField.Tag in node)) continue;
        if (hasTag(node, tag)) out.push(node);
        pushReversed(stack, node.children);
    }
    return out;
}

export function findFirst<const Tag extends string>(element: ElementNode, tag: Tag): ElementNode<Tag> | null {
    return findAll(element.children, tag)[0] ?? null;
}
