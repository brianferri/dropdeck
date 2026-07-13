export { HtmlTag, NodeField, ESCAPABLE_RAW_TEXT_TAGS, RAW_TEXT_TAGS, VOID_TAGS } from "./Specification.js";
export type {
    Attr,
    AttrList,
    Content,
    DomNode,
    ElementNode,
    Empty,
    EmbeddedTag,
    EscapableRawTextTag,
    FlowTag,
    HeadingTag,
    Many,
    MetadataTag,
    One,
    Opt,
    PhrasingTag,
    RawTextTag,
    SectioningTag,
    Seq,
    Some,
    TextNode,
    VoidTag
} from "./typings/nodes.js";

export { decodeEntities, escapeAttribute, escapeText } from "./Entities.js";

export { parse } from "./Parser.js";
export type { Parse } from "./typings/parse.js";
export { sanitize } from "./Sanitize.js";
export { element, text } from "./builders.js";
export { attribute, childElements, findAll, findFirst, hasClass, textContent } from "./Query.js";
export { serialize, serializeAll } from "./Serializer.js";
export type { Serialize } from "./typings/serialize.js";

// CSS and Tailwind keep their `parse`/`Parse`/`serialize` names distinct from the HTML surface by living under
// the `@dropdeck/html/css` / `@dropdeck/html/tailwind` subpaths, where those identical names cannot collide.
