import { NotationKind as LatexKind } from "@dropdeck/latex";
import {
    accent, fenced, fraction, identifier, limitOperator, number, operator, radical, root, row, styled, subscript, superscript
} from "#/formula/build";
import { LIMITS_PLACEMENT, VARIANT, isColorCommand, isLimitsCommand, isVariantCommand, latexGlyph } from "#/formula/latex/glyphs";
import { isAccentKind } from "#/formula/accent";
import { isIntegralGlyph, isLimitOperatorGlyph } from "#/formula/limit_operator";
import { LimitPlacement, StyleKind } from "#/formula/nodes";
import type { Notation as LatexNotation } from "@dropdeck/latex";
import type { LimitOperatorGlyph } from "#/formula/limit_operator";
import type { AccentKind, MathVariant } from "#/formula/nodes";
import type { AttributeStyle, Notation } from "#/formula/typings/nodes";
import type { LowerLatex } from "./typings/lower.js";

function limitOperatorGlyph(node: LatexNotation): LimitOperatorGlyph | null {
    switch (node.kind) {
        case LatexKind.Operator:
        case LatexKind.Identifier: {
            const glyph = latexGlyph(node.symbol);
            return isLimitOperatorGlyph(glyph) ? glyph : null;
        }
        case LatexKind.Number:
        case LatexKind.Row:
        case LatexKind.Fenced:
        case LatexKind.Fraction:
        case LatexKind.Superscript:
        case LatexKind.Subscript:
        case LatexKind.Radical:
        case LatexKind.Accent:
            return null;
    }
}

// Integrals script their limits beside the sign; every other big operator stacks them, absent a `\limits`/`\nolimits`.
function defaultPlacement(glyph: string): LimitPlacement {
    return isIntegralGlyph(glyph) ? LimitPlacement.Beside : LimitPlacement.Stacked;
}

type ScriptParts = { base: LatexNotation, lower: Notation, upper: Notation };

// A `_`/`^`-scripted node (in either order); yields its innermost base and the lowered lower/upper limits.
function scriptParts(node: LatexNotation): ScriptParts | null {
    switch (node.kind) {
        case LatexKind.Superscript: {
            const [base, upper] = node.children;
            switch (base.kind) {
                case LatexKind.Subscript: return { base: base.children[0], lower: lowerLatexNode(base.children[1]), upper: lowerLatexNode(upper) };
                case LatexKind.Identifier:
                case LatexKind.Number:
                case LatexKind.Operator:
                case LatexKind.Row:
                case LatexKind.Fenced:
                case LatexKind.Fraction:
                case LatexKind.Superscript:
                case LatexKind.Radical:
                case LatexKind.Accent:
                    break;
            }
            return { base, lower: row([]), upper: lowerLatexNode(upper) };
        }
        case LatexKind.Subscript: {
            const [base, lower] = node.children;
            switch (base.kind) {
                case LatexKind.Superscript: return { base: base.children[0], lower: lowerLatexNode(lower), upper: lowerLatexNode(base.children[1]) };
                case LatexKind.Identifier:
                case LatexKind.Number:
                case LatexKind.Operator:
                case LatexKind.Row:
                case LatexKind.Fenced:
                case LatexKind.Fraction:
                case LatexKind.Subscript:
                case LatexKind.Radical:
                case LatexKind.Accent:
                    break;
            }
            return { base, lower: lowerLatexNode(lower), upper: row([]) };
        }
        case LatexKind.Identifier:
        case LatexKind.Number:
        case LatexKind.Operator:
        case LatexKind.Row:
        case LatexKind.Fenced:
        case LatexKind.Fraction:
        case LatexKind.Radical:
        case LatexKind.Accent:
            return null;
    }
}

type LimitOperatorSpec = { symbol: LimitOperatorGlyph, placement: LimitPlacement, lower: Notation, upper: Notation };

// A limit operator carrying its own `_`/`^` limits (`\int_a^b`); the placement follows the glyph's default.
function detectLimitOperator(node: LatexNotation): LimitOperatorSpec | null {
    const parts = scriptParts(node);
    if (parts === null) return null;
    const glyph = limitOperatorGlyph(parts.base);
    if (glyph === null) return null;
    return { symbol: glyph, placement: defaultPlacement(glyph), lower: parts.lower, upper: parts.upper };
}

function limitsOverride(base: LatexNotation): LimitPlacement | null {
    switch (base.kind) {
        case LatexKind.Identifier: return isLimitsCommand(base.symbol) ? LIMITS_PLACEMENT[base.symbol] : null;
        case LatexKind.Number:
        case LatexKind.Operator:
        case LatexKind.Row:
        case LatexKind.Fenced:
        case LatexKind.Fraction:
        case LatexKind.Superscript:
        case LatexKind.Subscript:
        case LatexKind.Radical:
        case LatexKind.Accent:
            return null;
    }
}

// A variant command (`\mathbf`) styles the group that follows it, so the row folds `\mathbf x` into one styled node.
function variantOf(node: LatexNotation): MathVariant | null {
    switch (node.kind) {
        case LatexKind.Identifier: return isVariantCommand(node.symbol) ? VARIANT[node.symbol] : null;
        case LatexKind.Number:
        case LatexKind.Operator:
        case LatexKind.Row:
        case LatexKind.Fenced:
        case LatexKind.Fraction:
        case LatexKind.Superscript:
        case LatexKind.Subscript:
        case LatexKind.Radical:
        case LatexKind.Accent:
            return null;
    }
}

function isColorHead(node: LatexNotation): boolean {
    switch (node.kind) {
        case LatexKind.Identifier: return isColorCommand(node.symbol);
        case LatexKind.Number:
        case LatexKind.Operator:
        case LatexKind.Row:
        case LatexKind.Fenced:
        case LatexKind.Fraction:
        case LatexKind.Superscript:
        case LatexKind.Subscript:
        case LatexKind.Radical:
        case LatexKind.Accent:
            return false;
    }
}

/**
 * Applies a font/color style to a directive's argument. The parser folds a trailing script (`\mathbf{v}^2`) onto the
 * group, so peel it back off and style only the base, matching how math lowers `bold(v)^2`.
 */
function styleContent(style: AttributeStyle, node: LatexNotation): Notation {
    switch (node.kind) {
        case LatexKind.Superscript: return superscript(styleContent(style, node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Subscript: return subscript(styleContent(style, node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Identifier:
        case LatexKind.Number:
        case LatexKind.Operator:
        case LatexKind.Row:
        case LatexKind.Fenced:
        case LatexKind.Fraction:
        case LatexKind.Radical:
        case LatexKind.Accent:
            return styled(style, lowerLatexNode(node));
    }
}

/**
 * Reads the color name out of a `\textcolor{red}{x}` group, which the parser splits into separate letter identifiers.
 * @throws {Error} when the group holds anything but letters.
 */
function colorName(node: LatexNotation): string {
    switch (node.kind) {
        case LatexKind.Identifier: return node.symbol;
        case LatexKind.Row: break;
        case LatexKind.Number:
        case LatexKind.Operator:
        case LatexKind.Fenced:
        case LatexKind.Fraction:
        case LatexKind.Superscript:
        case LatexKind.Subscript:
        case LatexKind.Radical:
        case LatexKind.Accent:
            throw new Error("\\textcolor expects a color name");
    }
    let name = "";
    for (const letter of node.children) {
        switch (letter.kind) {
            case LatexKind.Identifier: name += letter.symbol; break;
            case LatexKind.Number:
            case LatexKind.Operator:
            case LatexKind.Row:
            case LatexKind.Fenced:
            case LatexKind.Fraction:
            case LatexKind.Superscript:
            case LatexKind.Subscript:
            case LatexKind.Radical:
            case LatexKind.Accent:
                throw new Error("\\textcolor color name must be letters");
        }
    }
    return name;
}

// A scripted big operator takes the term after it as its operand (`\sum_{i=1}^{n} i^2` binds `i^2` under the ∑), and
// `\int\limits_a^b` -- a bare operator then a `\limits`/`\nolimits` carrying the limits -- overrides the placement.
function lowerLatexRow(children: ReadonlyArray<LatexNotation>): Notation {
    const items: Array<Notation> = [];
    let index = 0;
    while (index < children.length) {
        if (isColorHead(children[index]) && index + 2 < children.length) {
            items.push(styleContent({ kind: StyleKind.Color, color: colorName(children[index + 1]) }, children[index + 2]));
            index += 3;
            continue;
        }
        const variant = variantOf(children[index]);
        if (variant !== null && index + 1 < children.length) {
            items.push(styleContent({ kind: StyleKind.Variant, variant }, children[index + 1]));
            index += 2;
            continue;
        }
        const glyph = limitOperatorGlyph(children[index]);
        const parts = glyph !== null && index + 1 < children.length ? scriptParts(children[index + 1]) : null;
        const override = parts !== null ? limitsOverride(parts.base) : null;
        if (glyph !== null && parts !== null && override !== null) {
            const hasBody = index + 2 < children.length;
            items.push(limitOperator(glyph, override, parts.lower, parts.upper, hasBody ? lowerLatexNode(children[index + 2]) : row([])));
            index += hasBody ? 3 : 2;
            continue;
        }
        const spec = detectLimitOperator(children[index]);
        if (spec === null) {
            items.push(lowerLatexNode(children[index]));
            index += 1;
        } else {
            const hasBody = index + 1 < children.length;
            items.push(limitOperator(spec.symbol, spec.placement, spec.lower, spec.upper, hasBody ? lowerLatexNode(children[index + 1]) : row([])));
            index += hasBody ? 2 : 1;
        }
    }
    return items.length === 1 ? items[0] : row(items);
}

// The package's accent commands share the shared IR's accent names, so an unknown one is a coverage gap to raise.
function accentKindOf(command: string): AccentKind {
    if (isAccentKind(command)) return command;
    throw new Error(`unknown LaTeX accent '\\${command}'`);
}

function lowerLatexNode(node: LatexNotation): Notation {
    switch (node.kind) {
        case LatexKind.Identifier: return identifier(latexGlyph(node.symbol));
        case LatexKind.Number: return number(node.value);
        case LatexKind.Operator: return operator(latexGlyph(node.symbol));
        case LatexKind.Row: return lowerLatexRow(node.children);
        case LatexKind.Fenced: return fenced(node.open, node.close, node.children.map(lowerLatexNode));
        case LatexKind.Fraction: return fraction(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Superscript: return superscript(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Subscript: return subscript(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]));
        case LatexKind.Radical:
            return node.children.length === 2
                ? root(lowerLatexNode(node.children[0]), lowerLatexNode(node.children[1]))
                : radical(lowerLatexNode(node.children[0]));
        case LatexKind.Accent: return accent(accentKindOf(node.command), lowerLatexNode(node.children[0]));
    }
}

export function lowerLatex<const N extends LatexNotation>(node: N): LowerLatex<N> {
    return lowerLatexNode(node) as LowerLatex<N>;
}
