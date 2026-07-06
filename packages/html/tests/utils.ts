import { parse } from "../src/Parser.js";
import { findAll } from "../src/Query.js";
import { NodeField } from "../src/Specification.js";
import type { ElementNode } from "../src/Specification.js";

export function firstElement(html: string): ElementNode {
    const [node] = parse(html);
    if (!(NodeField.Tag in node)) throw new Error("expected a leading element");
    return node;
}

export function firstByTag<const Tag extends string>(html: string, tag: Tag): ElementNode<Tag> {
    return findAll(parse(html), tag)[0];
}
