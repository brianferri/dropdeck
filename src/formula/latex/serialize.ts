import { NotationKind } from "#/formula/nodes";
import { latexSymbol } from "#/formula/latex/glyphs";
import type { Notation } from "#/formula/typings/nodes";
import type { ToLatex } from "./typings/serialize.js";

function latexArg(node: Notation): string {
    return node.kind === NotationKind.Row ? `{${toLatexNode(node)}}` : toLatexNode(node);
}

function toLatexNode(node: Notation): string {
    switch (node.kind) {
        case NotationKind.Identifier: return latexSymbol(node.symbol);
        case NotationKind.Number: return String(node.value);
        case NotationKind.Operator: return latexSymbol(node.symbol);
        case NotationKind.Row: return node.children.map(toLatexNode).join(" ");
        case NotationKind.Fenced: return `${node.open}${node.children.map(toLatexNode).join(" ")}${node.close}`;
        case NotationKind.Fraction: return `\\frac{${toLatexNode(node.children[0])}}{${toLatexNode(node.children[1])}}`;
        case NotationKind.Superscript: return `${latexArg(node.children[0])}^{${toLatexNode(node.children[1])}}`;
        case NotationKind.Subscript: return `${latexArg(node.children[0])}_{${toLatexNode(node.children[1])}}`;
        case NotationKind.Radical:
            return node.children.length === 2
                ? `\\sqrt[${toLatexNode(node.children[1])}]{${toLatexNode(node.children[0])}}`
                : `\\sqrt{${toLatexNode(node.children[0])}}`;
        case NotationKind.Nary:
            return `${latexSymbol(node.symbol)}_{${toLatexNode(node.children[0])}}^{${toLatexNode(node.children[1])}} ${toLatexNode(node.children[2])}`;
        case NotationKind.Accent: return `\\${node.accent}{${toLatexNode(node.children[0])}}`;
    }
}

export function toLatex<const N extends Notation>(node: N): ToLatex<N> {
    return toLatexNode(node) as ToLatex<N>;
}
