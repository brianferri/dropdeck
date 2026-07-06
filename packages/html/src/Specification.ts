export enum NodeField {
    Tag = "tag",
    Text = "text"
}

export const HtmlTag = {
    Html: "html",
    Head: "head",
    Body: "body",
    Title: "title",
    Base: "base",
    Link: "link",
    Meta: "meta",
    Style: "style",
    Script: "script",
    Noscript: "noscript",
    Article: "article",
    Aside: "aside",
    Nav: "nav",
    Section: "section",
    H1: "h1",
    H2: "h2",
    H3: "h3",
    H4: "h4",
    H5: "h5",
    H6: "h6",
    Hgroup: "hgroup",
    Header: "header",
    Footer: "footer",
    Address: "address",
    Main: "main",
    P: "p",
    Hr: "hr",
    Pre: "pre",
    Blockquote: "blockquote",
    Ol: "ol",
    Ul: "ul",
    Menu: "menu",
    Li: "li",
    Dl: "dl",
    Dt: "dt",
    Dd: "dd",
    Figure: "figure",
    Figcaption: "figcaption",
    Div: "div",
    A: "a",
    Em: "em",
    Strong: "strong",
    Small: "small",
    S: "s",
    Cite: "cite",
    Q: "q",
    Dfn: "dfn",
    Abbr: "abbr",
    Data: "data",
    Time: "time",
    Code: "code",
    Var: "var",
    Samp: "samp",
    Kbd: "kbd",
    Sub: "sub",
    Sup: "sup",
    I: "i",
    B: "b",
    U: "u",
    Mark: "mark",
    Ruby: "ruby",
    Rt: "rt",
    Rp: "rp",
    Bdi: "bdi",
    Bdo: "bdo",
    Span: "span",
    Br: "br",
    Wbr: "wbr",
    Ins: "ins",
    Del: "del",
    Picture: "picture",
    Source: "source",
    Img: "img",
    Iframe: "iframe",
    Embed: "embed",
    Object: "object",
    Param: "param",
    Video: "video",
    Audio: "audio",
    Track: "track",
    Map: "map",
    Area: "area",
    Canvas: "canvas",
    Svg: "svg",
    Math: "math",
    Table: "table",
    Caption: "caption",
    Colgroup: "colgroup",
    Col: "col",
    Tbody: "tbody",
    Thead: "thead",
    Tfoot: "tfoot",
    Tr: "tr",
    Td: "td",
    Th: "th",
    Form: "form",
    Label: "label",
    Input: "input",
    Button: "button",
    Select: "select",
    Datalist: "datalist",
    Optgroup: "optgroup",
    Option: "option",
    Textarea: "textarea",
    Output: "output",
    Progress: "progress",
    Meter: "meter",
    Fieldset: "fieldset",
    Legend: "legend",
    Details: "details",
    Summary: "summary",
    Dialog: "dialog"
} as const;
export type HtmlTag = typeof HtmlTag[keyof typeof HtmlTag];

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

type Tags<K extends keyof typeof HtmlTag> = (typeof HtmlTag)[K];
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

export const VOID_TAGS = [
    HtmlTag.Area,
    HtmlTag.Base,
    HtmlTag.Br,
    HtmlTag.Col,
    HtmlTag.Embed,
    HtmlTag.Hr,
    HtmlTag.Img,
    HtmlTag.Input,
    HtmlTag.Link,
    HtmlTag.Meta,
    HtmlTag.Param,
    HtmlTag.Source,
    HtmlTag.Track,
    HtmlTag.Wbr
] as const;
export type VoidTag = typeof VOID_TAGS[number];

// Raw-text elements hold text, not markup: a parser must read to their matching close tag without interpreting
// any `<` inside as a tag. `title`/`textarea` decode entities (escapable raw text); `script`/`style` do not.
export const RAW_TEXT_TAGS = [
    HtmlTag.Script,
    HtmlTag.Style,
    HtmlTag.Textarea,
    HtmlTag.Title
] as const;
export type RawTextTag = typeof RAW_TEXT_TAGS[number];

export const ESCAPABLE_RAW_TEXT_TAGS = [
    HtmlTag.Textarea,
    HtmlTag.Title
] as const;
export type EscapableRawTextTag = typeof ESCAPABLE_RAW_TEXT_TAGS[number];
