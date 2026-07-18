import type { FirstMatch, Repeat, ReplaceAll } from "@dropdeck/common";
import type { ListDelimiter, ListMarker } from "../Specification.js";
import type {
    Blocks, BlockNode, BlockQuoteNode, CodeBlockNode, CodeNode, DocumentNode, EmphasisNode, HardBreakNode,
    HeadingNode, HtmlBlockNode, HtmlInlineNode, ImageNode, InlineNode, Inlines, LinkNode, ListItemNode, ListNode,
    ParagraphNode, SoftBreakNode, StrongNode, TextNode, ThematicBreakNode
} from "./nodes.js";

type FillFrom<Char extends string, Counter extends ReadonlyArray<unknown>> =
    Counter extends readonly [unknown, ...infer Rest] ? `${Char}${FillFrom<Char, Rest>}` : "";
type Fill<Char extends string, N extends number> = FillFrom<Char, Repeat<unknown, N>>;

// A run of spaces as wide as `S`, so a continuation line aligns under the marker its first line carried;
// each character contributes one space.
type SpaceFor<Char extends string> = Char extends "" ? "" : " ";
type Blank<S extends string> = S extends `${infer Head}${infer Tail}` ? `${SpaceFor<Head>}${Blank<Tail>}` : "";

// The first line carries `Lead`; every subsequent line is re-indented by `Pad`, matching `body.split.map.join`.
type IndentBlock<Lead extends string, Pad extends string, Body extends string> =
    `${Lead}${ReplaceAll<Body, "\n", `\n${Pad}`>}`;

type TextText<N> = N extends TextNode<infer V> ? V : false;
type SoftBreakText<N> = N extends SoftBreakNode ? "\n" : false;
type HardBreakText<N> = N extends HardBreakNode ? "  \n" : false;
type CodeText<N> = N extends CodeNode<infer V> ? `\`${V}\`` : false;
type HtmlInlineText<N> = N extends HtmlInlineNode<infer V> ? V : false;
type EmphasisText<N> = N extends EmphasisNode<infer C> ? `*${SerializeInlines<C>}*` : false;
type StrongText<N> = N extends StrongNode<infer C> ? `**${SerializeInlines<C>}**` : false;
type LinkText<N> = N extends LinkNode<infer D, string, infer C> ? `[${SerializeInlines<C>}](${D})` : false;
type ImageText<N> = N extends ImageNode<infer D, string, infer C> ? `![${SerializeInlines<C>}](${D})` : false;

type SerializeInline<N extends InlineNode> = FirstMatch<[
    TextText<N>, SoftBreakText<N>, HardBreakText<N>, CodeText<N>, HtmlInlineText<N>,
    EmphasisText<N>, StrongText<N>, LinkText<N>, ImageText<N>
]>;

type SerializeInlines<Nodes extends Inlines> =
    Nodes extends readonly []
        ? ""
        : Nodes extends readonly [infer Head extends InlineNode, ...infer Rest extends Inlines]
            ? `${SerializeInline<Head>}${SerializeInlines<Rest>}`
            : string;

type ItemLead<Ordered extends boolean, Marker extends string, Num extends number> =
    Ordered extends true ? `${Num}${Marker} ` : `${Marker} `;

type SerializeItem<Ordered extends boolean, Marker extends string, Num extends number, Item extends ListItemNode> =
    Item extends ListItemNode<infer C>
        ? ItemLead<Ordered, Marker, Num> extends infer L extends string
            ? IndentBlock<L, Blank<L>, SerializeBlocks<C>>
            : never
        : never;

type SerializeItems<
    Ordered extends boolean,
    Marker extends string,
    Items extends ReadonlyArray<ListItemNode>,
    Counter extends ReadonlyArray<unknown>
> = Items extends readonly []
    ? ""
    : Items extends readonly [infer Item extends ListItemNode, ...infer Rest extends ReadonlyArray<ListItemNode>]
        ? Rest extends readonly []
            ? SerializeItem<Ordered, Marker, Counter["length"], Item>
            : `${SerializeItem<Ordered, Marker, Counter["length"], Item>}\n${SerializeItems<Ordered, Marker, Rest, [...Counter, unknown]>}`
        : string;

// An ordered list numbers from `Start` via a length counter; a widened discriminant cannot be spelled, so it
// degrades to the plain `string` the runtime is a member of rather than inventing a wrong number or marker.
type SerializeList<L extends ListNode> =
    L extends ListNode<infer Items, infer Ordered, infer Start, boolean, infer Marker>
        ? boolean extends Ordered
            ? string
            : (ListMarker | ListDelimiter) extends Marker
                ? string
                : Ordered extends true
                    ? number extends Start ? string : SerializeItems<true, Marker, Items, Repeat<unknown, Start>>
                    : SerializeItems<false, Marker, Items, []>
        : string;

type ThematicBreakText<N> = N extends ThematicBreakNode ? "---" : false;
type HeadingText<N> = N extends HeadingNode<infer L, infer C> ? `${Fill<"#", L>} ${SerializeInlines<C>}` : false;
type CodeBlockText<N> =
    N extends CodeBlockNode<infer Info, infer Lit, infer Fenced>
        ? Fenced extends true ? `\`\`\`${Info}\n${Lit}\n\`\`\`` : IndentBlock<"    ", "    ", Lit>
        : false;
type HtmlBlockText<N> = N extends HtmlBlockNode<infer Lit> ? Lit : false;
type ParagraphText<N> = N extends ParagraphNode<infer C> ? SerializeInlines<C> : false;
type BlockQuoteText<N> = N extends BlockQuoteNode<infer C> ? IndentBlock<"> ", "> ", SerializeBlocks<C>> : false;
type ListText<N> = N extends ListNode ? SerializeList<N> : false;
type ListItemText<N> = N extends ListItemNode<infer C> ? SerializeBlocks<C> : false;

type SerializeBlock<N extends BlockNode> = FirstMatch<[
    ThematicBreakText<N>, HeadingText<N>, CodeBlockText<N>, HtmlBlockText<N>,
    ParagraphText<N>, BlockQuoteText<N>, ListText<N>, ListItemText<N>
]>;

type SerializeBlocks<Nodes extends Blocks> =
    Nodes extends readonly []
        ? ""
        : Nodes extends readonly [infer Head extends BlockNode, ...infer Rest extends Blocks]
            ? Rest extends readonly []
                ? `${SerializeBlock<Head>}`
                : `${SerializeBlock<Head>}\n\n${SerializeBlocks<Rest>}`
            : string;

/** Renders a document node back to Markdown at the type level, the exact twin of the runtime `serialize`. */
export type Serialize<N extends DocumentNode> = N extends DocumentNode<infer C> ? SerializeBlocks<C> : string;
