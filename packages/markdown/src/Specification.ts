// The CommonMark 0.31.2 abstract syntax tree
export enum NodeKind {
    Document = "document",
    ThematicBreak = "thematic-break",
    Heading = "heading",
    CodeBlock = "code-block",
    HtmlBlock = "html-block",
    Paragraph = "paragraph",
    BlockQuote = "block-quote",
    List = "list",
    ListItem = "list-item",
    Text = "text",
    SoftBreak = "soft-break",
    HardBreak = "hard-break",
    Code = "code",
    Emphasis = "emphasis",
    Strong = "strong",
    Link = "link",
    Image = "image",
    HtmlInline = "html-inline"
}

export enum ListMarker {
    Dash = "-",
    Plus = "+",
    Asterisk = "*"
}

export enum ListDelimiter {
    Period = ".",
    Paren = ")"
}

export const TAB_STOP = 4;
export const CODE_INDENT = 4;
export const THEMATIC_BREAK_MARKERS: ReadonlyArray<string> = ["-", "_", "*"];
export const ATX_LEVEL_MAX = 6;
