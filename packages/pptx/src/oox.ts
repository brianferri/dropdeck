/* eslint-disable @typescript-eslint/naming-convention -- ST_* mirror the ECMA-376 schema names verbatim, and namespace prefixes are lower-case by spec. */

// The generic XML tree and serializer live in `@dropdeck/xml`; this module layers OOXML's namespace vocabulary on
// top and re-exports the core so the OOXML builders import both from one place.
export { element, text, xml } from "@dropdeck/xml";
export type {
    AssertUniqueAttrs,
    Attr,
    AttrList,
    AttrScalar,
    AttrSeq,
    Content,
    Element,
    Empty,
    Many,
    Node,
    One,
    Opt,
    OptAttr,
    ReqAttr,
    Seq,
    Serialize,
    Some,
    Text
} from "@dropdeck/xml";

export enum Namespace {
    a = "http://schemas.openxmlformats.org/drawingml/2006/main",
    p = "http://schemas.openxmlformats.org/presentationml/2006/main",
    r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    ct = "http://schemas.openxmlformats.org/package/2006/content-types",
    rel = "http://schemas.openxmlformats.org/package/2006/relationships"
}

export const NamespaceByPrefix = {
    a: Namespace.a,
    p: Namespace.p,
    r: Namespace.r,
    ct: Namespace.ct,
    rel: Namespace.rel
} as const satisfies Record<string, Namespace>;

export type Prefix = keyof typeof NamespaceByPrefix;
export type QName<P extends Prefix, Local extends string> = `${P}:${Local}`;
export type ParseQName<Q extends string> = Q extends `${infer P}:${infer Local}` ? { readonly prefix: P, readonly local: Local } : never;

export type ST_String = string;
export type ST_Boolean = boolean;

/* eslint-enable @typescript-eslint/naming-convention */
