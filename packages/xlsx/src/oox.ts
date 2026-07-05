/* eslint-disable @typescript-eslint/naming-convention -- ST_* mirror the ECMA-376 schema names verbatim. */

// SpreadsheetML elements sit in the default namespace, so only the root elements carry `xmlns`, not each tag.
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
    main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    ct = "http://schemas.openxmlformats.org/package/2006/content-types",
    rel = "http://schemas.openxmlformats.org/package/2006/relationships"
}

export type ST_String = string;
export type ST_Xstring = string;
export type ST_Boolean = boolean;

/* eslint-enable @typescript-eslint/naming-convention */
