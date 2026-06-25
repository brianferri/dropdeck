import type {
    BlockNode, Blocks, BlockQuoteNode, CodeBlockNode, CodeNode, DocumentNode, EmphasisNode, HeadingLevel,
    HeadingNode, ImageNode, InlineNode, Inlines, LinkNode, ListItemNode, ListNode, ParagraphNode, SoftBreakNode,
    StrongNode, TextNode, ThematicBreakNode
} from "./Specification.js";

type FirstMatch<Rules extends ReadonlyArray<unknown>> =
    Rules extends readonly [infer Head, ...infer Tail] ? [Head] extends [false] ? FirstMatch<Tail> : Head : false;

type Escapable =
    | "!" | "\"" | "#" | "$" | "%" | "&" | "'" | "(" | ")" | "*" | "+" | "," | "-" | "." | "/" | ":" | ";"
    | "<" | "=" | ">" | "?" | "@" | "[" | "\\" | "]" | "^" | "_" | "`" | "{" | "|" | "}" | "~";
type Delimiter = "`" | "*" | "_" | "[" | "!" | "<" | "\\" | "\n";

type TextOf<V extends string> = V extends "" ? readonly [] : readonly [TextNode<V>];

type ReadPlain<S extends string, Acc extends string = ""> =
    S extends `${infer C}${infer R}`
        ? Acc extends ""
            ? ReadPlain<R, C>
            : C extends Delimiter ? { text: Acc, rest: S } : ReadPlain<R, `${Acc}${C}`>
        : { text: Acc, rest: "" };

type IsAutolink<U extends string> =
    U extends `${string}:${string}` ? U extends `${string} ${string}` ? false : true : false;

type EscapeRule<S extends string> = S extends `\\${infer C}${infer R}` ? C extends Escapable ? { node: TextNode<C>, rest: R } : false : false;
type SoftBreakRule<S extends string> = S extends `\n${infer R}` ? { node: SoftBreakNode, rest: R } : false;
type CodeRule<S extends string> = S extends `\`${infer V}\`${infer R}` ? { node: CodeNode<V>, rest: R } : false;
type StrongRule<S extends string> = S extends `**${infer X}**${infer R}` ? X extends "" ? false : Inline<X, readonly [], ""> extends infer C extends Inlines ? { node: StrongNode<C>, rest: R } : false : false;
type EmStarRule<S extends string> = S extends `*${infer X}*${infer R}` ? X extends "" ? false : Inline<X, readonly [], ""> extends infer C extends Inlines ? { node: EmphasisNode<C>, rest: R } : false : false;
type EmUnderRule<S extends string> = S extends `_${infer X}_${infer R}` ? X extends "" ? false : Inline<X, readonly [], ""> extends infer C extends Inlines ? { node: EmphasisNode<C>, rest: R } : false : false;
type ImageRule<S extends string> = S extends `![${infer A}](${infer U})${infer R}` ? Inline<A, readonly [], ""> extends infer C extends Inlines ? { node: ImageNode<U, "", C>, rest: R } : false : false;
type LinkRule<S extends string> = S extends `[${infer A}](${infer U})${infer R}` ? Inline<A, readonly [], ""> extends infer C extends Inlines ? { node: LinkNode<U, "", C>, rest: R } : false : false;
type AutolinkRule<S extends string> = S extends `<${infer U}>${infer R}` ? IsAutolink<U> extends true ? { node: LinkNode<U, "", readonly [TextNode<U>]>, rest: R } : false : false;

type InlineChunk<S extends string> = FirstMatch<readonly [
    EscapeRule<S>,
    SoftBreakRule<S>,
    CodeRule<S>,
    StrongRule<S>,
    EmStarRule<S>,
    EmUnderRule<S>,
    ImageRule<S>,
    LinkRule<S>,
    AutolinkRule<S>
]>;

type Inline<S extends string, Nodes extends Inlines, Run extends string> =
    S extends ""
        ? readonly [...Nodes, ...TextOf<Run>]
        : InlineChunk<S> extends { node: infer N extends InlineNode, rest: infer R extends string }
            ? Inline<R, readonly [...Nodes, ...TextOf<Run>, N], "">
            : ReadPlain<S> extends { text: infer T extends string, rest: infer R extends string }
                ? Inline<R, Nodes, `${Run}${T}`>
                : readonly [...Nodes, ...TextOf<Run>];

export type ParseInline<S extends string> = string extends S ? Inlines : Inline<S, readonly [], "">;

type NextLine<S extends string> = S extends `${infer L}\n${infer R}` ? { line: L, rest: R } : { line: S, rest: "" };

type TrimStart<S extends string> = S extends ` ${infer R}` ? TrimStart<R> : S;
type TrimEnd<S extends string> = S extends `${infer R} ` ? TrimEnd<R> : S;
type Trim<S extends string> = TrimEnd<TrimStart<S>>;

type NoSpaces<S extends string, Acc extends string = ""> =
    S extends `${infer C}${infer R}` ? C extends " " ? NoSpaces<R, Acc> : NoSpaces<R, `${Acc}${C}`> : Acc;

type AllOf<S extends string, C extends string> = S extends "" ? true : S extends `${C}${infer R}` ? AllOf<R, C> : false;
type Repeated<B extends string, C extends string> = B extends `${C}${C}${C}${string}` ? AllOf<B, C> : false;
type IsThematic<L extends string> =
    NoSpaces<L> extends infer B extends string
        ? Repeated<B, "-"> extends true ? true : Repeated<B, "_"> extends true ? true : Repeated<B, "*"> extends true ? true : false
        : false;

type Atx<L extends string> =
    L extends `###### ${infer C}` ? { level: 6, content: Trim<C> }
        : L extends `##### ${infer C}` ? { level: 5, content: Trim<C> }
            : L extends `#### ${infer C}` ? { level: 4, content: Trim<C> }
                : L extends `### ${infer C}` ? { level: 3, content: Trim<C> }
                    : L extends `## ${infer C}` ? { level: 2, content: Trim<C> }
                        : L extends `# ${infer C}` ? { level: 1, content: Trim<C> }
                            : never;

type Setext<L extends string> =
    Trim<L> extends infer B extends string
        ? B extends "" ? never : AllOf<B, "="> extends true ? 1 : AllOf<B, "-"> extends true ? 2 : never
        : never;

type Fence<S extends string, Acc extends string> =
    S extends "" ? { literal: Acc, rest: "" }
        : NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
            ? L extends `\`\`\`${string}` ? { literal: Acc, rest: R } : Fence<R, Acc extends "" ? L : `${Acc}\n${L}`>
            : { literal: Acc, rest: "" };

type Indent<S extends string, Acc extends string> =
    NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
        ? L extends `    ${infer C}` ? Indent<R, Acc extends "" ? C : `${Acc}\n${C}`> : { literal: Acc, rest: S }
        : { literal: Acc, rest: "" };

type Quote<S extends string, Acc extends string> =
    NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
        ? L extends `> ${infer Q}` ? Quote<R, Acc extends "" ? Q : `${Acc}\n${Q}`>
            : L extends `>${infer Q}` ? Quote<R, Acc extends "" ? Q : `${Acc}\n${Q}`>
                : { inner: Acc, rest: S }
        : { inner: Acc, rest: S };

type Interrupts<L extends string> =
    IsThematic<L> extends true ? true
        : [Setext<L>] extends [never] ? Atx<L> extends never ? L extends `\`\`\`${string}` ? true : L extends `>${string}` ? true : false : true
            : true;

type Para<S extends string, Acc extends string> =
    S extends "" ? { text: Acc, rest: "" }
        : NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
            ? Trim<L> extends "" ? { text: Acc, rest: S }
                : Acc extends "" ? Para<R, L>
                    : Interrupts<L> extends true ? { text: Acc, rest: S } : Para<R, `${Acc}\n${L}`>
            : { text: Acc, rest: "" };

type Marker<L extends string> =
    L extends `- ${infer C}` ? C
        : L extends `* ${infer C}` ? C
            : L extends `+ ${infer C}` ? C
                : L extends `${number}. ${infer C}` ? C
                    : L extends `${number}) ${infer C}` ? C
                        : never;

type ListContent<S extends string, Texts extends ReadonlyArray<string>> =
    NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
        ? [Marker<L>] extends [never]
            ? { items: Texts, rest: S }
            : Marker<L> extends infer C extends string ? ListContent<R, readonly [...Texts, C]> : { items: Texts, rest: S }
        : { items: Texts, rest: S };

// One line per item, so its content is a single paragraph -- inline recursion only, never a block cycle.
type Items<Raw extends ReadonlyArray<string>, Acc extends ReadonlyArray<ListItemNode> = readonly []> =
    Raw extends readonly [infer Head extends string, ...infer Tail extends ReadonlyArray<string>]
        ? ParseInline<Head> extends infer I extends Inlines
            ? Items<Tail, readonly [...Acc, ListItemNode<readonly [ParagraphNode<I>]>]>
            : Acc
        : Acc;

// One named helper per multi-line/recursive construct; each builds its node, deferring child parses through
// `infer ... extends ...` so no helper carries an unresolved deep type -- the @dropdeck/html `Node` shape.
type IndentBlock<S extends string> = Indent<S, ""> extends { literal: infer Lit extends string, rest: infer IR extends string } ? { block: CodeBlockNode<"", Lit>, rest: IR } : never;
type FenceBlock<R extends string, Info extends string> = Fence<R, ""> extends { literal: infer Lit extends string, rest: infer FR extends string } ? { block: CodeBlockNode<Info, Lit>, rest: FR } : never;
type QuoteBlock<S extends string> =
    Quote<S, ""> extends { inner: infer Inner extends string, rest: infer QR extends string }
        ? ParseBlocks<Inner, readonly []> extends infer B extends Blocks ? { block: BlockQuoteNode<B>, rest: QR } : never
        : never;
type ListBlock<S extends string> =
    ListContent<S, readonly []> extends { items: infer Raw extends ReadonlyArray<string>, rest: infer LR extends string }
        ? Items<Raw> extends infer Its extends ReadonlyArray<ListItemNode> ? { block: ListNode<Its>, rest: LR } : never
        : never;
type SetextOrPara<S extends string> =
    Para<S, ""> extends { text: infer T extends string, rest: infer R extends string }
        ? ParseInline<T> extends infer I extends Inlines
            ? NextLine<R> extends { line: infer U extends string, rest: infer R2 extends string }
                ? [Setext<U>] extends [never]
                    ? { block: ParagraphNode<I>, rest: R }
                    : Setext<U> extends infer Lv extends HeadingLevel ? { block: HeadingNode<Lv, I>, rest: R2 } : never
                : { block: ParagraphNode<I>, rest: R }
            : never
        : never;

type HeadingBlock<A, R extends string> =
    A extends { level: infer Lv extends HeadingLevel, content: infer C extends string }
        ? ParseInline<C> extends infer I extends Inlines ? { block: HeadingNode<Lv, I>, rest: R } : never
        : never;

// Each rule guards on the first line's prefix and yields `false` when it does not apply, so the flat
// `FirstMatch` evaluates exactly one heavy helper -- the false branch of each guard is never entered.
type IndentRule<S extends string> =
    NextLine<S> extends { line: infer L extends string } ? L extends `    ${string}` ? IndentBlock<S> : false : false;
type ThematicRule<S extends string> =
    NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
        ? IsThematic<L> extends true ? { block: ThematicBreakNode, rest: R } : false
        : false;
type HeadingRule<S extends string> =
    NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
        ? [Atx<L>] extends [never] ? false : HeadingBlock<Atx<L>, R>
        : false;
type FenceRule<S extends string> =
    NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
        ? L extends `\`\`\`${infer Info}` ? FenceBlock<R, Trim<Info>> : false
        : false;
type QuoteRule<S extends string> =
    NextLine<S> extends { line: infer L extends string } ? L extends `>${string}` ? QuoteBlock<S> : false : false;
type ListRule<S extends string> =
    NextLine<S> extends { line: infer L extends string } ? [Marker<L>] extends [never] ? false : ListBlock<S> : false;

type Block<S extends string> = FirstMatch<readonly [
    IndentRule<S>,
    ThematicRule<S>,
    HeadingRule<S>,
    FenceRule<S>,
    QuoteRule<S>,
    ListRule<S>,
    SetextOrPara<S>
]>;

type ParseBlocks<S extends string, Acc extends Blocks> =
    S extends ""
        ? Acc
        : NextLine<S> extends { line: infer L extends string, rest: infer R extends string }
            ? Trim<L> extends ""
                ? ParseBlocks<R, Acc>
                : Block<S> extends { block: infer B extends BlockNode, rest: infer BR extends string }
                    ? ParseBlocks<BR, readonly [...Acc, B]>
                    : Acc
            : Acc;

type Normalize<S extends string> = S extends `${infer A}\r\n${infer B}` ? `${A}\n${Normalize<B>}` : S;

export type Parse<S extends string> =
    string extends S ? DocumentNode : DocumentNode<ParseBlocks<Normalize<S>, readonly []>>;
