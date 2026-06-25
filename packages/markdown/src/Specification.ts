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

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export enum ListMarker {
    Dash = "-",
    Plus = "+",
    Asterisk = "*"
}

export enum ListDelimiter {
    Period = ".",
    Paren = ")"
}

export type TextNode<V extends string = string> = { readonly kind: NodeKind.Text, readonly value: V };
export type SoftBreakNode = { readonly kind: NodeKind.SoftBreak };
export type HardBreakNode = { readonly kind: NodeKind.HardBreak };
export type CodeNode<V extends string = string> = { readonly kind: NodeKind.Code, readonly value: V };
export type HtmlInlineNode<V extends string = string> = { readonly kind: NodeKind.HtmlInline, readonly value: V };
export type EmphasisNode<C extends Inlines = Inlines> = { readonly kind: NodeKind.Emphasis, readonly children: C };
export type StrongNode<C extends Inlines = Inlines> = { readonly kind: NodeKind.Strong, readonly children: C };
export type LinkNode<D extends string = string, T extends string = string, C extends Inlines = Inlines> =
    { readonly kind: NodeKind.Link, readonly destination: D, readonly title: T, readonly children: C };
export type ImageNode<D extends string = string, T extends string = string, C extends Inlines = Inlines> =
    { readonly kind: NodeKind.Image, readonly destination: D, readonly title: T, readonly children: C };

export type InlineNode =
    | TextNode
    | SoftBreakNode
    | HardBreakNode
    | CodeNode
    | HtmlInlineNode
    | EmphasisNode
    | StrongNode
    | LinkNode
    | ImageNode;
export type Inlines = ReadonlyArray<InlineNode>;

export type ThematicBreakNode = { readonly kind: NodeKind.ThematicBreak };
export type HeadingNode<L extends HeadingLevel = HeadingLevel, C extends Inlines = Inlines> =
    { readonly kind: NodeKind.Heading, readonly level: L, readonly children: C };
export type CodeBlockNode<Info extends string = string, Literal extends string = string> =
    { readonly kind: NodeKind.CodeBlock, readonly fenced: boolean, readonly info: Info, readonly literal: Literal };
export type HtmlBlockNode<Literal extends string = string> = { readonly kind: NodeKind.HtmlBlock, readonly literal: Literal };
export type ParagraphNode<C extends Inlines = Inlines> = { readonly kind: NodeKind.Paragraph, readonly children: C };
export type BlockQuoteNode<C extends Blocks = Blocks> = { readonly kind: NodeKind.BlockQuote, readonly children: C };
export type ListItemNode<C extends Blocks = Blocks> = { readonly kind: NodeKind.ListItem, readonly children: C };
export type ListNode<Items extends ReadonlyArray<ListItemNode> = ReadonlyArray<ListItemNode>> =
    { readonly kind: NodeKind.List, readonly ordered: boolean, readonly start: number, readonly tight: boolean, readonly marker: ListMarker | ListDelimiter, readonly children: Items };

export type BlockNode =
    | ThematicBreakNode
    | HeadingNode
    | CodeBlockNode
    | HtmlBlockNode
    | ParagraphNode
    | BlockQuoteNode
    | ListNode
    | ListItemNode;
export type Blocks = ReadonlyArray<BlockNode>;

export type DocumentNode<C extends Blocks = Blocks> = { readonly kind: NodeKind.Document, readonly children: C };

export type Node = BlockNode | InlineNode | DocumentNode;
export type Content = ReadonlyArray<Node>;

// Arity combinators -- the house algebra for content models, the only sanctioned type-level spread use.
export type Empty = readonly [];
export type One<T extends Node> = readonly [T];
export type Opt<T extends Node> = readonly [] | readonly [T];
export type Many<T extends Node> = ReadonlyArray<T>;
export type Some<T extends Node> = readonly [T, ...ReadonlyArray<T>];
export type Seq<A extends Content, B extends Content> = readonly [...A, ...B];

export const TAB_STOP = 4;
export const CODE_INDENT = 4;
export const THEMATIC_BREAK_MARKERS: ReadonlyArray<string> = ["-", "_", "*"];
export const ATX_LEVEL_MAX = 6;
