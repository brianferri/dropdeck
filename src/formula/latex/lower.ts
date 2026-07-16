import { NotationKind as LatexKind } from "@dropdeck/latex";
import {
    accent, fenced, fraction, identifier, nary, number, operator, radical, root, row, subscript, superscript
} from "#/formula/build";
import { latexGlyph } from "#/formula/latex/glyphs";
import { isAccentKind } from "#/formula/accent";
import { isLimitOperatorGlyph } from "#/formula/nary";
import type { Notation as LatexNotation } from "@dropdeck/latex";
import type { LimitOperatorGlyph } from "#/formula/nary";
import type { AccentKind } from "#/formula/nodes";
import type { Notation } from "#/formula/typings/nodes";
import type { LowerLatex } from "./typings/lower.js";

function limitOperatorGlyph(node: LatexNotation): LimitOperatorGlyph | null {
    if (node.kind !== LatexKind.Operator && node.kind !== LatexKind.Identifier) return null;
    const glyph = latexGlyph(node.symbol);
    return isLimitOperatorGlyph(glyph) ? glyph : null;
}

type NarySpec = { symbol: LimitOperatorGlyph, lower: Notation, upper: Notation };

// A limit operator scripted with `_`/`^` limits (in either order); the scripts become its lower/upper slots.
function detectNary(node: LatexNotation): NarySpec | null {
    if (node.kind === LatexKind.Superscript) {
        const [base] = node.children;
        if (base.kind === LatexKind.Subscript) {
            const glyph = limitOperatorGlyph(base.children[0]);
            if (glyph !== null) return { symbol: glyph, lower: lowerLatexNode(base.children[1]), upper: lowerLatexNode(node.children[1]) };
        }
        const glyph = limitOperatorGlyph(base);
        if (glyph !== null) return { symbol: glyph, lower: row([]), upper: lowerLatexNode(node.children[1]) };
    }
    if (node.kind === LatexKind.Subscript) {
        const [base] = node.children;
        if (base.kind === LatexKind.Superscript) {
            const glyph = limitOperatorGlyph(base.children[0]);
            if (glyph !== null) return { symbol: glyph, lower: lowerLatexNode(node.children[1]), upper: lowerLatexNode(base.children[1]) };
        }
        const glyph = limitOperatorGlyph(base);
        if (glyph !== null) return { symbol: glyph, lower: lowerLatexNode(node.children[1]), upper: row([]) };
    }
    return null;
}

// A scripted big operator takes the term after it as its operand, so `\sum_{i=1}^{n} i^2` binds `i^2` under the ∑.
function lowerLatexRow(children: ReadonlyArray<LatexNotation>): Notation {
    const items: Array<Notation> = [];
    let index = 0;
    while (index < children.length) {
        const spec = detectNary(children[index]);
        if (spec === null) {
            items.push(lowerLatexNode(children[index]));
            index += 1;
        } else {
            const hasBody = index + 1 < children.length;
            items.push(nary(spec.symbol, spec.lower, spec.upper, hasBody ? lowerLatexNode(children[index + 1]) : row([])));
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
