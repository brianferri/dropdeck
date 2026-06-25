import { declaration, rule } from "../../src/css/builders.js";
import type { Parse } from "../../src/Parse.js";
import type { ElementNode } from "../../src/Specification.js";
import type { MatchesSelector, MatchesStylesheet } from "../../src/css/Match.js";

// `Expect<Equal<A, B>>` fails to typecheck unless A and B are identical -- each row is a structural-match assertion.
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type Doc = Parse<"<div class=\"a\"><span class=\"b c\"><i class=\"d\"></i></span></div>">;
type List = Parse<"<ul class=\"list\"><li class=\"item first\">x</li><li class=\"item\">y</li></ul>">;
type Sib = Parse<"<div><a class=\"x\"></a><b class=\"y\"></b><i class=\"z\"></i></div>">;

export type Assertions = [
    Expect<Equal<MatchesSelector<Doc, ".a">, true>>,
    Expect<Equal<MatchesSelector<Doc, "span">, true>>,
    Expect<Equal<MatchesSelector<Doc, ".z">, false>>,
    Expect<Equal<MatchesSelector<Doc, "section">, false>>,

    Expect<Equal<MatchesSelector<Doc, ".b.c">, true>>,
    Expect<Equal<MatchesSelector<Doc, ".b.x">, false>>,
    Expect<Equal<MatchesSelector<List, "li.item.first">, true>>,

    Expect<Equal<MatchesSelector<Doc, ".a .d">, true>>,
    Expect<Equal<MatchesSelector<Doc, ".a .b .d">, true>>,
    Expect<Equal<MatchesSelector<Doc, ".d .a">, false>>,

    Expect<Equal<MatchesSelector<Doc, ".a > .b">, true>>,
    Expect<Equal<MatchesSelector<Doc, ".b > .d">, true>>,
    Expect<Equal<MatchesSelector<Doc, ".a > .d">, false>>,

    Expect<Equal<MatchesSelector<Doc, ".a > .b .d">, true>>,
    Expect<Equal<MatchesSelector<List, ".list > .item">, true>>,

    Expect<Equal<MatchesSelector<Sib, ".x + .y">, true>>,
    Expect<Equal<MatchesSelector<Sib, ".x + .z">, false>>,
    Expect<Equal<MatchesSelector<List, ".first + .item">, true>>,

    Expect<Equal<MatchesSelector<Sib, ".x ~ .z">, true>>,
    Expect<Equal<MatchesSelector<Sib, ".y ~ .x">, false>>,
    Expect<Equal<MatchesSelector<List, ".first ~ .item">, true>>
];

// MatchesStylesheet tolerates classes the tree never carries (runtime state) as wildcards; every other selector
// segment must structurally apply.
type Nest = Parse<"<div class=\"box\"><div class=\"card\"><button class=\"btn lead\">x</button></div></div>">;
const goodCss = [
    rule([".box"], [declaration("color", "red")]),
    rule([".box.on"], [declaration("display", "none")]),
    rule([".box.busy .card"], [declaration("color", "blue")]),
    rule([".btn.lead"], [declaration("color", "green")])
];
const badCss = [rule([".card > .box"], [declaration("color", "red")])];
const typoCss = [
    // `.crad` is a typo of `.card`: absent from markup and not a declared runtime class, so it must match nothing.
    rule([".crad"], [declaration("color", "red")])
];

export type StylesheetAssertions = [
    Expect<Equal<MatchesStylesheet<Nest, typeof goodCss, "on" | "busy">, true>>,
    Expect<MatchesStylesheet<Nest, typeof badCss, "on" | "busy"> extends true ? false : true>,
    Expect<MatchesStylesheet<Nest, typeof typoCss, "on" | "busy"> extends true ? false : true>
];

// `Menu`'s children are a homogeneous array (a `.map()` result), not a fixed tuple; the matcher must still see a
// representative child so rules targeting the generated items apply.
type ElementNodeOf<Tag extends string, Cls extends string> =
    ElementNode<Tag, readonly [readonly ["class", Cls]], readonly []>;
type Menu = ElementNode<"div", readonly [readonly ["class", "menu"]], ReadonlyArray<ElementNodeOf<"button", "opt">>>;

export type DynamicChildAssertions = [
    Expect<Equal<MatchesSelector<Menu, ".menu > .opt">, true>>,
    Expect<Equal<MatchesSelector<Menu, ".menu button">, true>>,
    Expect<Equal<MatchesSelector<Menu, ".menu > .nope">, false>>
];
