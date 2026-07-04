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
    Some,
    Text
} from "./Specification.js";

export { xml } from "./Serializer.js";
export type { Serialize } from "./Serializer.js";

export { element, text } from "./builders.js";
