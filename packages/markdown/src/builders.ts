import type { ListDelimiter, ListMarker } from "./Specification.js";
import { NodeKind } from "./Specification.js";
import type {
    BlockQuoteNode, Blocks, CodeBlockNode, CodeNode, DocumentNode, EmphasisNode, HardBreakNode, HeadingLevel,
    HeadingNode, HtmlBlockNode, HtmlInlineNode, ImageNode, Inlines, LinkNode, ListItemNode,
    ListNode, ParagraphNode, SoftBreakNode, StrongNode, TextNode, ThematicBreakNode
} from "./typings/nodes.js";

export function text<const V extends string>(value: V): TextNode<V> {
    return { kind: NodeKind.Text, value };
}

export function softBreak(): SoftBreakNode {
    return { kind: NodeKind.SoftBreak };
}

export function hardBreak(): HardBreakNode {
    return { kind: NodeKind.HardBreak };
}

export function code<const V extends string>(value: V): CodeNode<V> {
    return { kind: NodeKind.Code, value };
}

export function htmlInline<const V extends string>(value: V): HtmlInlineNode<V> {
    return { kind: NodeKind.HtmlInline, value };
}

export function emphasis<const C extends Inlines>(children: C): EmphasisNode<C> {
    return { kind: NodeKind.Emphasis, children };
}

export function strong<const C extends Inlines>(children: C): StrongNode<C> {
    return { kind: NodeKind.Strong, children };
}

export function link<const D extends string, const T extends string, const C extends Inlines>(destination: D, title: T, children: C): LinkNode<D, T, C> {
    return { kind: NodeKind.Link, destination, title, children };
}

export function image<const D extends string, const T extends string, const C extends Inlines>(destination: D, title: T, children: C): ImageNode<D, T, C> {
    return { kind: NodeKind.Image, destination, title, children };
}

export function thematicBreak(): ThematicBreakNode {
    return { kind: NodeKind.ThematicBreak };
}

export function heading<const L extends HeadingLevel, const C extends Inlines>(level: L, children: C): HeadingNode<L, C> {
    return { kind: NodeKind.Heading, level, children };
}

export function codeBlock<const Info extends string, const Literal extends string>(fenced: boolean, info: Info, literal: Literal): CodeBlockNode<Info, Literal> {
    return { kind: NodeKind.CodeBlock, fenced, info, literal };
}

export function htmlBlock<const Literal extends string>(literal: Literal): HtmlBlockNode<Literal> {
    return { kind: NodeKind.HtmlBlock, literal };
}

export function paragraph<const C extends Inlines>(children: C): ParagraphNode<C> {
    return { kind: NodeKind.Paragraph, children };
}

export function blockQuote<const C extends Blocks>(children: C): BlockQuoteNode<C> {
    return { kind: NodeKind.BlockQuote, children };
}

export function listItem<const C extends Blocks>(children: C): ListItemNode<C> {
    return { kind: NodeKind.ListItem, children };
}

export function list<const Items extends ReadonlyArray<ListItemNode>>(ordered: boolean, start: number, tight: boolean, marker: ListMarker | ListDelimiter, children: Items): ListNode<Items> {
    return { kind: NodeKind.List, ordered, start, tight, marker, children };
}

export function document<const C extends Blocks>(children: C): DocumentNode<C> {
    return { kind: NodeKind.Document, children };
}
