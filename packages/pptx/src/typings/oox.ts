/* eslint-disable @typescript-eslint/naming-convention -- ST_* mirror the ECMA-376 schema names verbatim, and namespace prefixes are lower-case by spec. */

import type { NamespaceByPrefix } from "../oox.js";

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

export type Prefix = keyof typeof NamespaceByPrefix;
export type QName<P extends Prefix, Local extends string> = `${P}:${Local}`;
export type ParseQName<Q extends string> = Q extends `${infer P}:${infer Local}` ? { readonly prefix: P, readonly local: Local } : never;

export type ST_String = string;
export type ST_Boolean = boolean;

/* eslint-enable @typescript-eslint/naming-convention */
