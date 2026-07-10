import { NotationKind } from "./Specification.js";
import type {
    Content, FencedNode, FractionNode, IdentifierNode, Notation, NumberNode, OperatorNode,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode
} from "./Specification.js";

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

function serializeNode(node: Notation): string {
    switch (node.kind) {
        case NotationKind.Identifier: return node.symbol;
        case NotationKind.Number: return String(node.value);
        case NotationKind.Operator: return node.symbol;
        case NotationKind.Row: return serializeRow(node.children);
        case NotationKind.Fenced: return `${node.open}${serializeNode(node.children[0])}${node.close}`;
        case NotationKind.Fraction: return `\\frac{${serializeNode(node.children[0])}}{${serializeNode(node.children[1])}}`;
        case NotationKind.Superscript: return `${scriptBase(node.children[0])}^{${serializeNode(node.children[1])}}`;
        case NotationKind.Subscript: return `${scriptBase(node.children[0])}_{${serializeNode(node.children[1])}}`;
        case NotationKind.Radical:
            return node.children.length === 2
                ? `\\sqrt[${serializeNode(node.children[1])}]{${serializeNode(node.children[0])}}`
                : `\\sqrt{${serializeNode(node.children[0])}}`;
    }
}

export function serialize<const N extends Notation>(node: N): Serialize<N> {
    return serializeNode(node) as Serialize<N>;
}

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

type SerializeRow<Children extends Content> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? Rest extends readonly [] ? Serialize<Head> : `${Serialize<Head>} ${SerializeRow<Rest>}`
        : "";

type ScriptBase<Base extends Notation> = Base extends RowNode ? `{${Serialize<Base>}}` : Serialize<Base>;

type NumberText<E extends Notation> = E extends NumberNode<infer Value> ? `${Value}` : false;
type IdentifierText<E extends Notation> = E extends IdentifierNode<infer Symbol> ? Symbol : false;
type OperatorText<E extends Notation> = E extends OperatorNode<infer Symbol> ? Symbol : false;
type RowText<E extends Notation> = E extends RowNode<infer Children extends Content> ? SerializeRow<Children> : false;
type FencedText<E extends Notation> =
    E extends FencedNode<infer Open extends string, infer Close extends string, infer Children extends Content>
        ? Children extends readonly [infer Inner extends Notation] ? `${Open}${Serialize<Inner>}${Close}` : false
        : false;

type FractionText<E extends Notation> =
    E extends FractionNode<infer Children extends Content>
        ? Children extends readonly [infer Numerator extends Notation, infer Denominator extends Notation]
            ? `\\frac{${Serialize<Numerator>}}{${Serialize<Denominator>}}`
            : false
        : false;

type SuperscriptText<E extends Notation> =
    E extends SuperscriptNode<infer Children extends Content>
        ? Children extends readonly [infer Base extends Notation, infer Exponent extends Notation]
            ? `${ScriptBase<Base>}^{${Serialize<Exponent>}}`
            : false
        : false;

type SubscriptText<E extends Notation> =
    E extends SubscriptNode<infer Children extends Content>
        ? Children extends readonly [infer Base extends Notation, infer Index extends Notation]
            ? `${ScriptBase<Base>}_{${Serialize<Index>}}`
            : false
        : false;

type RadicalText<E extends Notation> =
    E extends RadicalNode<infer Children extends Content>
        ? Children extends readonly [infer Radicand extends Notation, infer Index extends Notation]
            ? `\\sqrt[${Serialize<Index>}]{${Serialize<Radicand>}}`
            : Children extends readonly [infer Radicand extends Notation]
                ? `\\sqrt{${Serialize<Radicand>}}`
                : false
        : false;

export type Serialize<E extends Notation> = FirstMatch<[
    NumberText<E>,
    IdentifierText<E>,
    OperatorText<E>,
    RowText<E>,
    FencedText<E>,
    FractionText<E>,
    SuperscriptText<E>,
    SubscriptText<E>,
    RadicalText<E>
]>;
