import { BinaryOperator, ExpressionKind, MathFunction, MathIntegral, MathLimit, OPERATOR_PRECEDENCE } from "@dropdeck/math";
import { accent, fenced, fraction, identifier, limitOperator, number, operator, radical, root, row, styled, subscript, superscript } from "#/formula/build";
import {
    BIG_OPERATOR_GLYPH, CONSTANT_GLYPH, INTEGRAL_GLYPH, LIM_OPERATOR, LIMITS_PLACEMENT, MATH_VARIANT, OPERATOR_GLYPH,
    isBigOperatorFunction, isColorFunction, isIntegralFunction, isLimFunction, isLimitsFunction, isMathFunction, isVariantFunction
} from "#/formula/math/glyphs";
import { isAccentKind } from "#/formula/accent";
import { LimitPlacement, NotationKind, StyleKind } from "#/formula/nodes";
import { keyGuard } from "@dropdeck/common";
import type { BinaryNode, Expression } from "@dropdeck/math";
import type { Notation } from "#/formula/typings/nodes";
import type { LowerMath, MathContent } from "./typings/lower.js";

function isRowBinary(expression: Expression): expression is BinaryNode {
    switch (expression.kind) {
        case ExpressionKind.Binary: break;
        case ExpressionKind.Number:
        case ExpressionKind.Variable:
        case ExpressionKind.Constant:
        case ExpressionKind.Call:
        case ExpressionKind.Negate:
        case ExpressionKind.Not:
            return false;
    }
    switch (expression.operator) {
        case BinaryOperator.Divide:
        case BinaryOperator.Power:
            return false;
        case BinaryOperator.Add:
        case BinaryOperator.Subtract:
        case BinaryOperator.Multiply:
        case BinaryOperator.LessThan:
        case BinaryOperator.GreaterThan:
        case BinaryOperator.LessOrEqual:
        case BinaryOperator.GreaterOrEqual:
        case BinaryOperator.Equal:
        case BinaryOperator.NotEqual:
        case BinaryOperator.And:
        case BinaryOperator.Or:
        case BinaryOperator.Approx:
        case BinaryOperator.Equiv:
        case BinaryOperator.Cong:
        case BinaryOperator.Sim:
        case BinaryOperator.Simeq:
        case BinaryOperator.Ll:
        case BinaryOperator.Gg:
        case BinaryOperator.In:
        case BinaryOperator.Notin:
        case BinaryOperator.Ni:
        case BinaryOperator.Parallel:
        case BinaryOperator.Mid:
        case BinaryOperator.Perp:
        case BinaryOperator.To:
        case BinaryOperator.Gets:
        case BinaryOperator.Mapsto:
        case BinaryOperator.Uparrow:
        case BinaryOperator.Downarrow:
        case BinaryOperator.Leftrightarrow:
        case BinaryOperator.Longleftarrow:
        case BinaryOperator.Longrightarrow:
        case BinaryOperator.Hookrightarrow:
        case BinaryOperator.LeftarrowDouble:
        case BinaryOperator.RightarrowDouble:
        case BinaryOperator.LeftrightarrowDouble:
        case BinaryOperator.Implies:
        case BinaryOperator.Iff:
            return true;
    }
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
function lowerBigOperator(callee: keyof typeof BIG_OPERATOR_GLYPH, children: MathContent): Notation {
    const [index, lower, upper, body] = children;
    return limitOperator(BIG_OPERATOR_GLYPH[callee], LimitPlacement.Stacked, row([lowerNode(index), operator("="), lowerNode(lower)]), lowerNode(upper), lowerNode(body));
}

function lowerIntegral(callee: keyof typeof INTEGRAL_GLYPH, children: MathContent): Notation | null {
    const glyph = INTEGRAL_GLYPH[callee];
    if (children.length === 1) return limitOperator(glyph, LimitPlacement.Beside, row([]), row([]), lowerNode(children[0]));
    if (children.length === 3) return limitOperator(glyph, LimitPlacement.Beside, lowerNode(children[0]), lowerNode(children[1]), lowerNode(children[2]));
    return null;
}

function lowerLim(callee: keyof typeof LIM_OPERATOR, children: MathContent): Notation | null {
    if (children.length !== 2) return null;
    return limitOperator(LIM_OPERATOR[callee], LimitPlacement.Stacked, lowerNode(children[0]), row([]), lowerNode(children[1]));
}

type BuiltinCallee = MathFunction | MathIntegral | MathLimit;

function isBuiltinCallee(callee: string): callee is BuiltinCallee {
    if (isMathFunction(callee)) return true;
    if (isIntegralFunction(callee)) return true;
    return isLimFunction(callee);
}

function lowerFunction(callee: BuiltinCallee, children: MathContent): Notation | null {
    switch (callee) {
        case MathFunction.Sqrt: if (children.length === 1) return radical(lowerNode(children[0])); break;
        case MathFunction.Root: if (children.length === 2) return root(lowerNode(children[1]), lowerNode(children[0])); break;
        case MathFunction.Fact: if (children.length === 1) return row([lowerNode(children[0]), operator("!")]); break;
        case MathFunction.Sin:
        case MathFunction.Cos:
        case MathFunction.Tan:
        case MathFunction.Cot:
        case MathFunction.Sec:
        case MathFunction.Csc:
        case MathFunction.Arcsin:
        case MathFunction.Arccos:
        case MathFunction.Arctan:
        case MathFunction.Sinh:
        case MathFunction.Cosh:
        case MathFunction.Tanh:
        case MathFunction.Ln:
        case MathFunction.Exp:
        case MathFunction.Abs:
        case MathFunction.Log:
        case MathFunction.Gcd:
        case MathFunction.Deg:
        case MathFunction.Det:
        case MathFunction.Dim:
        case MathFunction.Ker:
        case MathFunction.Arg:
        case MathFunction.Sum:
        case MathFunction.Prod:
        case MathFunction.Coprod:
        case MathFunction.Bigcup:
        case MathFunction.Bigcap:
        case MathFunction.Bigvee:
        case MathFunction.Bigwedge:
        case MathFunction.Bigoplus:
        case MathFunction.Bigotimes:
        case MathFunction.Bigsqcup:
        case MathIntegral.Int:
        case MathIntegral.Oint:
        case MathIntegral.Iint:
        case MathIntegral.Iiint:
        case MathLimit.Lim:
        case MathLimit.Limsup:
        case MathLimit.Liminf:
        case MathLimit.Sup:
        case MathLimit.Inf:
        case MathLimit.Limmax:
        case MathLimit.Limmin:
            break;
    }
    if (isBigOperatorFunction(callee) && children.length === 4) return lowerBigOperator(callee, children);
    if (isIntegralFunction(callee)) return lowerIntegral(callee, children);
    if (isLimFunction(callee)) return lowerLim(callee, children);
    return null;
}

/**
 * Lowers `color(c, x)` to a color-styled `x`.
 * @throws {Error} when the first argument is not a bare color name.
 */
function lowerColor(children: MathContent): Notation {
    const [color, content] = children;
    switch (color.kind) {
        case ExpressionKind.Variable: break;
        case ExpressionKind.Number:
        case ExpressionKind.Constant:
        case ExpressionKind.Call:
        case ExpressionKind.Negate:
        case ExpressionKind.Not:
        case ExpressionKind.Binary:
            throw new Error("color() expects a color name as its first argument");
    }
    return styled({ kind: StyleKind.Color, color: color.name }, lowerNode(content));
}

/**
 * Re-emits a big operator with its limit placement overridden, for `limits(op)`/`nolimits(op)`.
 * @throws {Error} when the argument does not lower to a big operator.
 */
function withPlacement(placement: LimitPlacement, node: Notation): Notation {
    switch (node.kind) {
        case NotationKind.LimitOperator: break;
        case NotationKind.Identifier:
        case NotationKind.Number:
        case NotationKind.Operator:
        case NotationKind.Row:
        case NotationKind.Fenced:
        case NotationKind.Fraction:
        case NotationKind.Superscript:
        case NotationKind.Subscript:
        case NotationKind.Radical:
        case NotationKind.Accent:
        case NotationKind.Styled:
            throw new Error("limits() and nolimits() expect a big operator argument");
    }
    return limitOperator(node.symbol, placement, node.children[0], node.children[1], node.children[2]);
}

function lowerCall(expression: Expression & { kind: ExpressionKind.Call }): Notation {
    const { callee } = expression;
    const { children } = expression;
    if (isBuiltinCallee(callee)) {
        const lowered = lowerFunction(callee, children);
        if (lowered !== null) return lowered;
    }
    if (isAccentKind(callee) && children.length === 1) return accent(callee, lowerNode(children[0]));
    if (isVariantFunction(callee) && children.length === 1) return styled({ kind: StyleKind.Variant, variant: MATH_VARIANT[callee] }, lowerNode(children[0]));
    if (isColorFunction(callee) && children.length === 2) return lowerColor(children);
    if (isLimitsFunction(callee) && children.length === 1) return withPlacement(LIMITS_PLACEMENT[callee], lowerNode(children[0]));
    return row([identifier(callee), fenced("(", ")", [lowerArgs(children)])]);
}

function lowerBinary(expression: BinaryNode): Notation {
    const [left, right] = expression.children;
    switch (expression.operator) {
        case BinaryOperator.Divide: return fraction(lowerNode(left), lowerNode(right));
        case BinaryOperator.Power: return superscript(wrapTight(left), lowerNode(right));
        case BinaryOperator.Add:
        case BinaryOperator.Subtract:
        case BinaryOperator.Multiply:
        case BinaryOperator.LessThan:
        case BinaryOperator.GreaterThan:
        case BinaryOperator.LessOrEqual:
        case BinaryOperator.GreaterOrEqual:
        case BinaryOperator.Equal:
        case BinaryOperator.NotEqual:
        case BinaryOperator.And:
        case BinaryOperator.Or:
        case BinaryOperator.Approx:
        case BinaryOperator.Equiv:
        case BinaryOperator.Cong:
        case BinaryOperator.Sim:
        case BinaryOperator.Simeq:
        case BinaryOperator.Ll:
        case BinaryOperator.Gg:
        case BinaryOperator.In:
        case BinaryOperator.Notin:
        case BinaryOperator.Ni:
        case BinaryOperator.Parallel:
        case BinaryOperator.Mid:
        case BinaryOperator.Perp:
        case BinaryOperator.To:
        case BinaryOperator.Gets:
        case BinaryOperator.Mapsto:
        case BinaryOperator.Uparrow:
        case BinaryOperator.Downarrow:
        case BinaryOperator.Leftrightarrow:
        case BinaryOperator.Longleftarrow:
        case BinaryOperator.Longrightarrow:
        case BinaryOperator.Hookrightarrow:
        case BinaryOperator.LeftarrowDouble:
        case BinaryOperator.RightarrowDouble:
        case BinaryOperator.LeftrightarrowDouble:
        case BinaryOperator.Implies:
        case BinaryOperator.Iff:
            break;
    }
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
