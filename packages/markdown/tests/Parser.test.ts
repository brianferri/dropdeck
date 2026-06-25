import { test } from "node:test";
import assert from "node:assert/strict";
import { NodeKind, parse, parseInlines, serialize } from "../src/index.js";

await test("parse: ATX heading carries its level and inline children", () => {
    const doc = parse("## Hello **world**");
    const [heading] = doc.children;
    assert.deepEqual(heading, {
        kind: NodeKind.Heading,
        level: 2,
        children: [
            { kind: NodeKind.Text, value: "Hello " },
            { kind: NodeKind.Strong, children: [ { kind: NodeKind.Text, value: "world" } ] }
        ]
    });
});

await test("parse: thematic break, fenced code, and paragraph as sibling blocks", () => {
    const doc = parse("---\n\n```js\nconst x = 1;\n```\n\ntext here");
    assert.deepEqual(doc.children.map((block) => block.kind), [
        NodeKind.ThematicBreak,
        NodeKind.CodeBlock,
        NodeKind.Paragraph
    ]);
    assert.deepEqual(doc.children[1], { kind: NodeKind.CodeBlock, fenced: true, info: "js", literal: "const x = 1;" });
});

await test("parse: blockquote nests its inner blocks", () => {
    const doc = parse("> quoted\n> # title");
    const [quote] = doc.children;
    assert.equal(quote.kind, NodeKind.BlockQuote);
    assert.deepEqual(quote.children.map((block) => block.kind), [NodeKind.Paragraph, NodeKind.Heading]);
});

await test("parse: bullet list with a nested sublist", () => {
    const doc = parse("- one\n- two\n  - nested\n");
    const [list] = doc.children;
    assert.equal(list.kind, NodeKind.List);
    assert.equal(list.ordered, false);
    assert.equal(list.children.length, 2);
    const [, second] = list.children;
    assert.deepEqual(second.children.map((block) => block.kind), [NodeKind.Paragraph, NodeKind.List]);
});

await test("parse: ordered list keeps its start and delimiter", () => {
    const doc = parse("3. first\n4. second");
    const [list] = doc.children;
    assert.equal(list.kind, NodeKind.List);
    assert.equal(list.ordered, true);
    assert.equal(list.start, 3);
    assert.equal(list.marker, ".");
});

await test("parse: setext headings from underlines", () => {
    const doc = parse("Title\n===\n\nSub\n---");
    assert.deepEqual(doc.children.map((block) => block.kind), [NodeKind.Heading, NodeKind.Heading]);
    assert.deepEqual(doc.children.map((block) => block.level), [1, 2]);
});

await test("parse: indented code block", () => {
    const doc = parse("    line one\n    line two");
    assert.deepEqual(doc.children[0], { kind: NodeKind.CodeBlock, fenced: false, info: "", literal: "line one\nline two" });
});

await test("parseInlines: escapes, autolink, code, link, image", () => {
    assert.deepEqual(parseInlines("a \\* b <https://x.dev> `c` [t](u) ![a](i)"), [
        { kind: NodeKind.Text, value: "a " },
        { kind: NodeKind.Text, value: "*" },
        { kind: NodeKind.Text, value: " b " },
        { kind: NodeKind.Link, destination: "https://x.dev", title: "", children: [ { kind: NodeKind.Text, value: "https://x.dev" } ] },
        { kind: NodeKind.Text, value: " " },
        { kind: NodeKind.Code, value: "c" },
        { kind: NodeKind.Text, value: " " },
        { kind: NodeKind.Link, destination: "u", title: "", children: [ { kind: NodeKind.Text, value: "t" } ] },
        { kind: NodeKind.Text, value: " " },
        { kind: NodeKind.Image, destination: "i", title: "", children: [ { kind: NodeKind.Text, value: "a" } ] }
    ]);
});

await test("serialize: round-trips a representative document", () => {
    const source = "# Title\n\nA **bold** and `code` line.\n\n- one\n- two\n\n> quoted";
    assert.equal(serialize(parse(source)), source);
});
