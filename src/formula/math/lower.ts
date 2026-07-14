import { BinaryOperator, ExpressionKind, MathFunction, OPERATOR_PRECEDENCE } from "@dropdeck/math";
import { accent, fenced, fraction, identifier, nary, number, operator, radical, row, subscript, superscript } from "#/formula/build";
import { CONSTANT_GLYPH, NARY_GLYPH, OPERATOR_GLYPH, isMathFunction, isNaryFunction } from "#/formula/math/glyphs";
import { isAccentKind } from "#/formula/accent";
import { keyGuard } from "@dropdeck/common";
import type { BinaryNode, Expression } from "@dropdeck/math";
import type { Notation } from "#/formula/typings/nodes";
import type { LowerMath, MathContent } from "./typings/lower.js";

function isRowBinary(expression: Expression): expression is BinaryNode {
    if (expression.kind !== ExpressionKind.Binary) return false;
    if (expression.operator === BinaryOperator.Divide) return false;
    return expression.operator !== BinaryOperator.Power;
}

function wrapChild(child: Expression, parentLevel: number, tight: boolean): Notation {
    if (!isRowBinary(child)) return lowerNode(child);
    const childLevel = OPERATOR_PRECEDENCE[child.operator];
    const fence = tight ? childLevel <= parentLevel : childLevel < parentLevel;
    return fence ? fenced("(", ")", [lowerNode(child)]) : lowerNode(child);
}

function wrapTight(child: Expression): Notation {
    return isRowBinary(child) ? fenced("(", ")", [lowerNode(child)]) : lowerNode(child);
}

const isConstantName = keyGuard(CONSTANT_GLYPH);

// A subscript's base or index may name a constant -- a Greek letter, say -- which renders as that glyph exactly as
// a bare name would: `omega_0` is ω_0, not the letters `omega`.
function constantOr(name: string): string {
    return isConstantName(name) ? CONSTANT_GLYPH[name] : name;
}

function subscriptIndex(index: string): Notation {
    if (index === "") return identifier(index);
    const value = Number(index);
    return Number.isNaN(value) ? identifier(constantOr(index)) : number(value);
}

function splitVariable(name: string): Notation {
    const underscore = name.indexOf("_");
    if (underscore === -1) return identifier(name);
    return subscript(identifier(constantOr(name.slice(0, underscore))), subscriptIndex(name.slice(underscore + 1)));
}

function lowerArgs(children: MathContent): Notation {
    if (children.length === 1) return lowerNode(children[0]);
    const items: Array<Notation> = [];
    children.forEach((child, index) => {
        if (index > 0) items.push(operator(","));
        items.push(lowerNode(child));
    });
    return row(items);
}

// `sum(i, lo, up, body)` reads as ∑ from i=lo to up of body: the index and its start form the under-limit `i=lo`.
function lowerNary(callee: keyof typeof NARY_GLYPH, children: MathContent): Notation {
    const [index, lower, upper, body] = children;
    return nary(NARY_GLYPH[callee], row([lowerNode(index), operator("="), lowerNode(lower)]), lowerNode(upper), lowerNode(body));
}

function lowerFunction(callee: MathFunction, children: MathContent): Notation | null {
    if (callee === MathFunction.Sqrt && children.length === 1) return radical(lowerNode(children[0]));
    if (callee === MathFunction.Fact && children.length === 1) return row([lowerNode(children[0]), operator("!")]);
    if (isNaryFunction(callee) && children.length === 4) return lowerNary(callee, children);
    return null;
}

function lowerCall(expression: Expression & { kind: ExpressionKind.Call }): Notation {
    const { callee } = expression;
    const { children } = expression;
    if (isMathFunction(callee)) {
        const lowered = lowerFunction(callee, children);
        if (lowered !== null) return lowered;
    }
    if (isAccentKind(callee) && children.length === 1) return accent(callee, lowerNode(children[0]));
    return row([identifier(callee), fenced("(", ")", [lowerArgs(children)])]);
}

function lowerBinary(expression: BinaryNode): Notation {
    const [left, right] = expression.children;
    if (expression.operator === BinaryOperator.Divide) return fraction(lowerNode(left), lowerNode(right));
    if (expression.operator === BinaryOperator.Power) return superscript(wrapTight(left), lowerNode(right));
    const parentLevel = OPERATOR_PRECEDENCE[expression.operator];
    return row([wrapChild(left, parentLevel, false), operator(OPERATOR_GLYPH[expression.operator]), wrapChild(right, parentLevel, true)]);
}

function lowerNode(expression: Expression): Notation {
    switch (expression.kind) {
        case ExpressionKind.Number: return number(expression.value);
        case ExpressionKind.Variable: return splitVariable(expression.name);
        case ExpressionKind.Constant: return identifier(CONSTANT_GLYPH[expression.name]);
        case ExpressionKind.Negate: return row([operator("-"), wrapTight(expression.children[0])]);
        case ExpressionKind.Not: return row([operator("¬"), wrapTight(expression.children[0])]);
        case ExpressionKind.Call: return lowerCall(expression);
        case ExpressionKind.Binary: return lowerBinary(expression);
    }
}

export function lowerMath<const E extends Expression>(expression: E): LowerMath<E> {
    return lowerNode(expression) as LowerMath<E>;
}
