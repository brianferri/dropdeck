import { NotationKind } from "#/formula/nodes";
import type {
    Content, FencedNode, FractionNode, IdentifierNode, Notation, NumberNode, One, OperatorNode, Pair,
    RadicalNode, RowNode, SubscriptNode, SuperscriptNode
} from "#/formula/nodes";

export function identifier<const Symbol extends string>(symbol: Symbol): IdentifierNode<Symbol> {
    return { kind: NotationKind.Identifier, symbol };
}

export function number<const Value extends number>(value: Value): NumberNode<Value> {
    return { kind: NotationKind.Number, value };
}

export function operator<const Symbol extends string>(symbol: Symbol): OperatorNode<Symbol> {
    return { kind: NotationKind.Operator, symbol };
}

export function row<const Children extends Content>(children: Children): RowNode<Children> {
    return { kind: NotationKind.Row, children };
}

export function fenced<const Open extends string, const Close extends string, const Children extends Content>(
    open: Open,
    close: Close,
    children: Children
): FencedNode<Open, Close, Children> {
    return { kind: NotationKind.Fenced, open, close, children };
}

export function fraction<const Numerator extends Notation, const Denominator extends Notation>(
    numerator: Numerator,
    denominator: Denominator
): FractionNode<Pair<Numerator, Denominator>> {
    return { kind: NotationKind.Fraction, children: [numerator, denominator] as const };
}

export function superscript<const Base extends Notation, const Exponent extends Notation>(
    base: Base,
    exponent: Exponent
): SuperscriptNode<Pair<Base, Exponent>> {
    return { kind: NotationKind.Superscript, children: [base, exponent] as const };
}

export function subscript<const Base extends Notation, const Index extends Notation>(
    base: Base,
    index: Index
): SubscriptNode<Pair<Base, Index>> {
    return { kind: NotationKind.Subscript, children: [base, index] as const };
}

export function radical<const Radicand extends Notation>(radicand: Radicand): RadicalNode<One<Radicand>> {
    return { kind: NotationKind.Radical, children: [radicand] as const };
}
