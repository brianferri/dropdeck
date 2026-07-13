import type { ListDelimiter, ListMarker, NodeKind } from "../Specification.js";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

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
