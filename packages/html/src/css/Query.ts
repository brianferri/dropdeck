import { CssNodeKind } from "./Specification.js";
import type { AtRule, Declaration, Rule, Stylesheet } from "./Specification.js";

export function rules(sheet: Stylesheet): Array<Rule> {
    const out: Array<Rule> = [];
    for (const node of sheet) if (node.kind === CssNodeKind.Rule) out.push(node);
    return out;
}

export function atRules(sheet: Stylesheet): Array<AtRule> {
    const out: Array<AtRule> = [];
    for (const node of sheet) if (node.kind === CssNodeKind.AtRule) out.push(node);
    return out;
}

export function rulesFor(sheet: Stylesheet, selector: string): Array<Rule> {
    const out: Array<Rule> = [];
    for (const node of sheet) if (node.kind === CssNodeKind.Rule && node.selectors.includes(selector)) out.push(node);
    return out;
}

// The last matching declaration wins, mirroring how the cascade resolves a property repeated inside one block.
export function declarationValue(rule: Rule, property: string): string | null {
    return styleValue(rule.declarations, property);
}

export function descriptorValue(atRule: AtRule, property: string): string | null {
    if (atRule.body === null) return null;
    const declarations: Array<Declaration> = [];
    for (const node of atRule.body) if (node.kind === CssNodeKind.Declaration) declarations.push(node);
    return styleValue(declarations, property);
}

export function styleValue(declarations: ReadonlyArray<Declaration>, property: string): string | null {
    let found: Declaration | null = null;
    for (const declaration of declarations) if (declaration.property === property) found = declaration;
    return found === null ? null : found.value;
}
