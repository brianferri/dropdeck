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
    ParseQName,
    Prefix,
    QName,
    ReqAttr,
    Seq,
    Serialize,
    Some,
    ST_Boolean,
    ST_String,
    Text
} from "./typings/oox.js";

/* eslint-disable @typescript-eslint/naming-convention -- namespace prefixes are lower-case by spec. */
export enum Namespace {
    a = "http://schemas.openxmlformats.org/drawingml/2006/main",
    c = "http://schemas.openxmlformats.org/drawingml/2006/chart",
    p = "http://schemas.openxmlformats.org/presentationml/2006/main",
    r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    ct = "http://schemas.openxmlformats.org/package/2006/content-types",
    rel = "http://schemas.openxmlformats.org/package/2006/relationships"
}

export const NamespaceByPrefix = {
    a: Namespace.a,
    c: Namespace.c,
    p: Namespace.p,
    r: Namespace.r,
    ct: Namespace.ct,
    rel: Namespace.rel
} as const satisfies Record<string, Namespace>;
/* eslint-enable @typescript-eslint/naming-convention */
