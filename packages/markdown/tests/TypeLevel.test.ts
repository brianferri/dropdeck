import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/index.js";
import type { Parse, ParseInline } from "../src/index.js";
import type {
    CodeNode, DocumentNode, EmphasisNode, HeadingNode, LinkNode, ListItemNode, ListNode, ParagraphNode,
    StrongNode, TextNode, ThematicBreakNode
} from "../src/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type InlineChecks = [
    Assert<Equal<ParseInline<"a **b** c">, readonly [
        TextNode<"a ">,
        StrongNode<readonly [TextNode<"b">]>,
        TextNode<" c">
    ]>>,
    Assert<Equal<ParseInline<"see `x` and [t](u)">, readonly [
        TextNode<"see ">,
        CodeNode<"x">,
        TextNode<" and ">,
        LinkNode<"u", "", readonly [TextNode<"t">]>
    ]>>,
    Assert<Equal<ParseInline<"*em* z">, readonly [EmphasisNode<readonly [TextNode<"em">]>, TextNode<" z">]>>
];

export type BlockChecks = [
    Assert<Equal<Parse<"# Hi">, DocumentNode<readonly [HeadingNode<1, readonly [TextNode<"Hi">]>]>>>,
    Assert<Equal<Parse<"---">, DocumentNode<readonly [ThematicBreakNode]>>>,
    Assert<Equal<Parse<"a **b**">, DocumentNode<readonly [ParagraphNode<readonly [TextNode<"a ">, StrongNode<readonly [TextNode<"b">]>]>]>>>,
    Assert<Equal<Parse<"- x\n- y">, DocumentNode<readonly [ListNode<readonly [
        ListItemNode<readonly [ParagraphNode<readonly [TextNode<"x">]>]>,
        ListItemNode<readonly [ParagraphNode<readonly [TextNode<"y">]>]>
    ]>]>>>,
    Assert<Equal<Parse<string>, DocumentNode>>
];

await test("parse: the runtime value matches the type-level Parse for a literal", () => {
    const doc = parse("# Hi");
    assert.deepEqual(doc.children[0], { kind: "heading", level: 1, children: [ { kind: "text", value: "Hi" } ] });
});
