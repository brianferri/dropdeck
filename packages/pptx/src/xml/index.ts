export { Namespace, NamespaceByPrefix } from "./Specification.js";
export type {
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
    Some,
    ST_Boolean,
    ST_String,
    Text
} from "./Specification.js";

export { xml } from "./Serializer.js";
export type { Serialize } from "./Serializer.js";

export { element, text } from "./builders.js";
