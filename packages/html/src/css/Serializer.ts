import { CssNodeKind } from "./Specification.js";
import type { Declaration, Rule, StyleNode, Stylesheet, AtRule } from "./Specification.js";

type SerializeDecl<D extends Declaration> = `${D["property"]}: ${D["value"]}${D["important"] extends true ? " !important" : ""}`;

type SerializeDecls<D extends ReadonlyArray<Declaration>> =
    D extends readonly [infer Head extends Declaration, ...infer Rest extends ReadonlyArray<Declaration>]
        ? Rest extends readonly [] ? SerializeDecl<Head> : `${SerializeDecl<Head>}; ${SerializeDecls<Rest>}`
        : "";

type JoinSelectors<S extends ReadonlyArray<string>> =
    S extends readonly [infer Head extends string, ...infer Rest extends ReadonlyArray<string>]
        ? Rest extends readonly [] ? Head : `${Head}, ${JoinSelectors<Rest>}`
        : "";

type Prelude<P extends string> = P extends "" ? "" : ` ${P}`;

type SerializeNode<N extends StyleNode> =
    N extends Declaration ? `${SerializeDecl<N>};`
        : N extends Rule<infer Selectors, infer Body> ? `${JoinSelectors<Selectors>} { ${SerializeDecls<Body>} }`
            : N extends AtRule<infer Name, infer Pre, infer Body>
                ? Body extends Stylesheet ? `${Name}${Prelude<Pre>} { ${SerializeNodes<Body>} }` : `${Name}${Prelude<Pre>};`
                : "";

type SerializeNodes<S extends Stylesheet> =
    S extends readonly [infer Head extends StyleNode, ...infer Rest extends Stylesheet]
        ? Rest extends readonly [] ? SerializeNode<Head> : `${SerializeNode<Head>} ${SerializeNodes<Rest>}`
        : "";

export type SerializeStyle<D extends ReadonlyArray<Declaration>> = SerializeDecls<D>;
export type SerializeStylesheet<S extends Stylesheet> = SerializeNodes<S>;

function declarationText(declaration: Declaration): string {
    return `${declaration.property}: ${declaration.value}${declaration.important ? " !important" : ""}`;
}

function nodeText(node: StyleNode): string {
    if (node.kind === CssNodeKind.Declaration) return `${declarationText(node)};`;
    if (node.kind === CssNodeKind.Rule) return `${node.selectors.join(", ")} { ${renderStyle(node.declarations)} }`;
    const prelude = node.prelude === "" ? "" : ` ${node.prelude}`;
    if (node.body === null) return `${node.name}${prelude};`;
    return `${node.name}${prelude} { ${renderSheet(node.body)} }`;
}

function renderStyle(declarations: ReadonlyArray<Declaration>): string {
    const parts: Array<string> = [];
    for (const declaration of declarations) parts.push(declarationText(declaration));
    return parts.join("; ");
}

function renderSheet(sheet: Stylesheet): string {
    const parts: Array<string> = [];
    for (const node of sheet) parts.push(nodeText(node));
    return parts.join(" ");
}

export function serializeStyle<const D extends ReadonlyArray<Declaration>>(declarations: D): SerializeStyle<D> {
    return renderStyle(declarations) as SerializeStyle<D>;
}

export function serialize<const S extends Stylesheet>(sheet: S): SerializeStylesheet<S> {
    return renderSheet(sheet) as SerializeStylesheet<S>;
}
