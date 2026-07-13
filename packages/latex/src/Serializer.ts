import { LatexStructuralCommand, NotationKind } from "./Specification.js";
import type { Content, Notation } from "./typings/nodes.js";
import type { Serialize } from "./typings/serialize.js";

// Row elements join with a space: a command abutting a letter (`\cdot c`) would otherwise lex as one longer
// command (`\cdotc`), and two numbers (`2 3`) would merge into one -- whitespace keeps the token boundaries.
function serializeRow(children: Content): string {
    return children.map(serializeNode).join(" ");
}

// A script binds only the single base to its left, so a row base must be braced -- `a + b^{2}` would bind the
// exponent to `b` alone, `{a + b}^{2}` keeps the whole row under the script.
function scriptBase(node: Notation): string {
    return node.kind === NotationKind.Row ? `{${serializeNode(node)}}` : serializeNode(node);
}

// A command followed by each child in its own braces (`\frac{a}{b}`); the layout constructs share this shape.
function structural(command: LatexStructuralCommand, children: Content): string {
    return `\\${command}${children.map((child) => `{${serializeNode(child)}}`).join("")}`;
}

// A command with an optional bracketed index before its braced operand (`\sqrt[n]{x}`, else `\sqrt{x}`).
function indexed(command: LatexStructuralCommand, children: Content): string {
    return children.length === 2
        ? `\\${command}[${serializeNode(children[1])}]{${serializeNode(children[0])}}`
        : structural(command, children);
}

function serializeNode(node: Notation): string {
    switch (node.kind) {
        case NotationKind.Identifier: return node.symbol;
        case NotationKind.Number: return String(node.value);
        case NotationKind.Operator: return node.symbol;
        case NotationKind.Row: return serializeRow(node.children);
        case NotationKind.Fenced: return `${node.open}${serializeNode(node.children[0])}${node.close}`;
        case NotationKind.Fraction: return structural(LatexStructuralCommand.Frac, node.children);
        case NotationKind.Superscript: return `${scriptBase(node.children[0])}^{${serializeNode(node.children[1])}}`;
        case NotationKind.Subscript: return `${scriptBase(node.children[0])}_{${serializeNode(node.children[1])}}`;
        case NotationKind.Radical: return indexed(LatexStructuralCommand.Sqrt, node.children);
        case NotationKind.Accent: return `\\${node.command}{${serializeNode(node.children[0])}}`;
    }
}

export function serialize<const N extends Notation>(node: N): Serialize<N> {
    return serializeNode(node) as Serialize<N>;
}
