import type { HtmlTag as HtmlTagTable, ESCAPABLE_RAW_TEXT_TAGS, RAW_TEXT_TAGS, VOID_TAGS } from "../Specification.js";

export type Attr<Name extends string = string> = readonly [Name, string];
export type AttrList = ReadonlyArray<Attr>;

// Named to avoid colliding with the DOM lib's global `Node`/`Element`/`Text` (and the OOXML package's `Node`) at a consumer's import site.
export type TextNode = {
    readonly text: string
};

export type ElementNode<
    Tag extends string = string,
    Attributes extends AttrList = AttrList,
    Children extends Content = Content
> = {
    readonly tag: Tag,
    readonly attrs: Attributes,
    readonly children: Children
};

export type DomNode = ElementNode | TextNode;
export type Content = ReadonlyArray<DomNode>;

export type Empty = readonly [];
export type One<T extends DomNode> = readonly [T];
export type Opt<T extends DomNode> = readonly [] | readonly [T];
export type Many<T extends DomNode> = ReadonlyArray<T>;
export type Some<T extends DomNode> = readonly [T, ...ReadonlyArray<T>];
export type Seq<A extends Content, B extends Content> = readonly [...A, ...B];

type Tags<K extends keyof typeof HtmlTagTable> = (typeof HtmlTagTable)[K];
export type HeadingTag = Tags<"H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "Hgroup">;
export type SectioningTag = Tags<"Article" | "Aside" | "Nav" | "Section">;
export type MetadataTag = Tags<"Base" | "Link" | "Meta" | "Noscript" | "Script" | "Style" | "Title">;
export type EmbeddedTag = Tags<"Audio" | "Canvas" | "Embed" | "Iframe" | "Img" | "Object" | "Picture" | "Svg" | "Video">;
export type PhrasingTag =
    | Tags<
        | "A" | "Abbr" | "B" | "Bdi" | "Bdo" | "Br" | "Button" | "Cite" | "Code" | "Data" | "Datalist" | "Del"
        | "Dfn" | "Em" | "I" | "Input" | "Ins" | "Kbd" | "Label" | "Mark" | "Meter" | "Output" | "Progress"
        | "Q" | "Ruby" | "S" | "Samp" | "Select" | "Small" | "Span" | "Strong" | "Sub" | "Sup" | "Textarea"
        | "Time" | "U" | "Var" | "Wbr"
    >
    | EmbeddedTag;
export type FlowTag =
    | Tags<
        | "Address" | "Blockquote" | "Details" | "Dialog" | "Div" | "Dl" | "Fieldset" | "Figure" | "Footer"
        | "Form" | "Header" | "Hr" | "Main" | "Map" | "Menu" | "Ol" | "P" | "Pre" | "Table" | "Ul"
    >
    | HeadingTag | SectioningTag | PhrasingTag;

export type VoidTag = typeof VOID_TAGS[number];
export type RawTextTag = typeof RAW_TEXT_TAGS[number];
export type EscapableRawTextTag = typeof ESCAPABLE_RAW_TEXT_TAGS[number];
