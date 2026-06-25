import type { Combinator, SelectorKind, SimpleSelector } from "./Selector.js";
import type { ParseSelector } from "./ParseSelector.js";
import type { Rule, Stylesheet } from "./Specification.js";
import type { ElementNode } from "../Specification.js";

type All<U> = false extends U ? false : true;

type AttrValue<Attrs, Name extends string> =
    Attrs extends ReadonlyArray<infer Pair extends readonly [string, string]>
        ? Pair extends readonly [Name, infer Value extends string] ? Value : never
        : never;

type SplitWhitespace<S extends string> =
    S extends `${infer Head} ${infer Tail}`
        ? Head extends "" ? SplitWhitespace<Tail> : Head | SplitWhitespace<Tail>
        : S extends "" ? never : S;

type ClassesOf<El> = El extends { readonly attrs: infer A } ? SplitWhitespace<AttrValue<A, "class">> : never;
type IdOf<El> = El extends { readonly attrs: infer A } ? AttrValue<A, "id"> : never;
type TagOf<El> = El extends { readonly tag: infer Tag extends string } ? Tag : never;

// Kept as an ordered tuple so the sibling combinators can read order; a homogeneous `.map()` array collapses to one
// representative element, matching rules that target the generated items regardless of their count or order.
type ChildElements<Children> =
    Children extends readonly [] ? readonly []
        : Children extends readonly [infer Head, ...infer Tail]
            ? Head extends ElementNode ? readonly [Head, ...ChildElements<Tail>] : ChildElements<Tail>
            : Children extends ReadonlyArray<infer El>
                ? El extends ElementNode ? readonly [El] : readonly []
                : readonly [];
type KidsOf<El> = El extends { readonly children: infer Children } ? ChildElements<Children> : readonly [];

type MatchSimple<El, S extends SimpleSelector, Runtime extends string> =
    S["kind"] extends SelectorKind.Universal ? true
        : S["kind"] extends SelectorKind.Type ? ([S["name"]] extends [TagOf<El>] ? true : false)
            : S["kind"] extends SelectorKind.Class
                ? [S["name"]] extends [ClassesOf<El>] ? true : S["name"] extends Runtime ? true : false
                : S["kind"] extends SelectorKind.Id ? ([S["name"]] extends [IdOf<El>] ? true : false)
                    : true;

type MatchCompound<El, Compound, Runtime extends string> =
    Compound extends ReadonlyArray<infer S> ? All<S extends SimpleSelector ? MatchSimple<El, S, Runtime> : true> : true;

type MatchAnchored<El, Following extends ReadonlyArray<ElementNode>, Steps, Runtime extends string> =
    Steps extends readonly [infer Step extends { readonly compound: unknown }, ...infer Rest]
        ? MatchCompound<El, Step["compound"], Runtime> extends true
            ? Rest extends readonly [infer Next extends { readonly combinator: Combinator }, ...Array<unknown>]
                ? Next["combinator"] extends Combinator.Child ? AnchorEach<KidsOf<El>, Rest, Runtime>
                    : Next["combinator"] extends Combinator.NextSibling
                        ? Following extends readonly [infer F extends ElementNode, ...infer FT extends ReadonlyArray<ElementNode>]
                            ? MatchAnchored<F, FT, Rest, Runtime> : false
                        : Next["combinator"] extends Combinator.SubsequentSibling ? AnchorEach<Following, Rest, Runtime>
                            : SearchList<KidsOf<El>, Rest, Runtime>
                : true
            : false
        : true;

type AnchorEach<List extends ReadonlyArray<ElementNode>, Steps, Runtime extends string> =
    List extends readonly [infer Head extends ElementNode, ...infer Tail extends ReadonlyArray<ElementNode>]
        ? MatchAnchored<Head, Tail, Steps, Runtime> extends true ? true : AnchorEach<Tail, Steps, Runtime>
        : false;

type SearchList<List extends ReadonlyArray<ElementNode>, Steps, Runtime extends string> =
    List extends readonly [infer Head extends ElementNode, ...infer Tail extends ReadonlyArray<ElementNode>]
        ? MatchAnchored<Head, Tail, Steps, Runtime> extends true ? true
            : SearchList<KidsOf<Head>, Steps, Runtime> extends true ? true
                : SearchList<Tail, Steps, Runtime>
        : false;

type RootList<Tree> = Tree extends ReadonlyArray<unknown> ? Tree : readonly [Tree];

export type MatchesSelector<Tree, Selector extends string, Runtime extends string = never> =
    SearchList<ChildElements<RootList<Tree>>, ParseSelector<Selector>, Runtime>;

export type MatchesAll<Tree, Selectors extends ReadonlyArray<string>> =
    Selectors extends readonly [infer Selector extends string, ...infer Rest extends ReadonlyArray<string>]
        ? MatchesSelector<Tree, Selector> extends true
            ? MatchesAll<Tree, Rest>
            : `selector "${Selector}" matches no element in the view`
        : true;

type SelectorErrors<Tree, Selectors, Runtime extends string> =
    Selectors extends ReadonlyArray<infer Selector>
        ? Selector extends string
            ? MatchesSelector<Tree, Selector, Runtime> extends true ? never : `selector "${Selector}" matches no element in the view`
            : never
        : never;
type RuleErrors<Tree, Node, Runtime extends string> =
    Node extends Rule<infer Selectors, infer _Body> ? SelectorErrors<Tree, Selectors, Runtime> : never;
type StylesheetErrors<Tree, Css, Runtime extends string> =
    Css extends ReadonlyArray<infer Node> ? RuleErrors<Tree, Node, Runtime> : never;

export type MatchesStylesheet<Tree, Css extends Stylesheet, Runtime extends string = never> =
    [StylesheetErrors<Tree, Css, Runtime>] extends [never]
        ? true
        : StylesheetErrors<Tree, Css, Runtime>;
