import { NotationKind, StyleKind } from "#/formula/nodes";
import {
    CALLEE_BY_GLYPH, ColorFunction, CONSTANT_BY_GLYPH, MATH_TOKEN_BY_GLYPH, VARIANT_CALLEE,
    isCalleeGlyph, isConstantGlyph, isTokenGlyph
} from "#/formula/math/glyphs";
import type { Notation } from "#/formula/typings/nodes";
import type { ToMath } from "./typings/serialize.js";

// A row carries looser-binding operators, so it is parenthesised where math precedence would otherwise regroup it.
function mathGroup(node: Notation): string {
    return node.kind === NotationKind.Row ? `(${toMathNode(node)})` : toMathNode(node);
}

// `sum(i, 1, n, body)` reads its index and start back out of the `i = 1` lower limit the lowering built.
function toMathLimitOperator(callee: string, children: ReadonlyArray<Notation>): string {
    const [lower, upper, body] = children;
    switch (lower.kind) {
        case NotationKind.Row:
            if (lower.children.length !== 3) throw new Error(`a math ${callee} needs an 'index = start' lower limit`);
            break;
        case NotationKind.Identifier:
        case NotationKind.Number:
        case NotationKind.Operator:
        case NotationKind.Fenced:
        case NotationKind.Fraction:
        case NotationKind.Superscript:
        case NotationKind.Subscript:
        case NotationKind.Radical:
        case NotationKind.LimitOperator:
        case NotationKind.Accent:
        case NotationKind.Styled:
            throw new Error(`a math ${callee} needs an 'index = start' lower limit`);
    }
    return `${callee}(${toMathNode(lower.children[0])}, ${toMathNode(lower.children[2])}, ${toMathNode(upper)}, ${toMathNode(body)})`;
}

function toMathNode(node: Notation): string {
    switch (node.kind) {
        case NotationKind.Number: return String(node.value);
        case NotationKind.Identifier: return isConstantGlyph(node.symbol) ? CONSTANT_BY_GLYPH[node.symbol] : node.symbol;
        case NotationKind.Operator: return isTokenGlyph(node.symbol) ? MATH_TOKEN_BY_GLYPH[node.symbol] : node.symbol;
        case NotationKind.Row: return node.children.map(toMathNode).join(" ");
        case NotationKind.Fenced: return `${node.open}${node.children.map(toMathNode).join(" ")}${node.close}`;
        case NotationKind.Fraction: return `${mathGroup(node.children[0])} / ${mathGroup(node.children[1])}`;
        case NotationKind.Superscript: return `${mathGroup(node.children[0])}^${mathGroup(node.children[1])}`;
        case NotationKind.Subscript: return `${toMathNode(node.children[0])}_${toMathNode(node.children[1])}`;
        case NotationKind.Radical: return `sqrt(${toMathNode(node.children[0])})`;
        case NotationKind.LimitOperator: {
            if (!isCalleeGlyph(node.symbol)) throw new Error(`the operator '${node.symbol}' has no math call form`);
            return toMathLimitOperator(CALLEE_BY_GLYPH[node.symbol], node.children);
        }
        case NotationKind.Accent: return `${node.accent}(${toMathNode(node.children[0])})`;
        case NotationKind.Styled:
            return node.style.kind === StyleKind.Variant
                ? `${VARIANT_CALLEE[node.style.variant]}(${toMathNode(node.children[0])})`
                : `${ColorFunction.Color}(${node.style.color}, ${toMathNode(node.children[0])})`;
    }
}

export function toMath<const N extends Notation>(node: N): ToMath<N> {
    return toMathNode(node) as ToMath<N>;
}
