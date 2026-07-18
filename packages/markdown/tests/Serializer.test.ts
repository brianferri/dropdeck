import { test } from "node:test";
import assert from "node:assert/strict";
import {
    blockQuote, code, codeBlock, document, emphasis, heading, link, list, listItem, ListDelimiter, ListMarker,
    paragraph, serialize, strong, text, thematicBreak
} from "../src/index.js";
import type { Equal, Expect } from "@dropdeck/common";
import type { Serialize } from "../src/index.js";

const doc = document([
    thematicBreak(),
    heading(2, [text("Hi "), emphasis([text("there")])]),
    paragraph([text("A "), strong([text("bold")]), text(" "), code("c"), text(" "), link("u", "", [text("t")])]),
    codeBlock(true, "js", "x=1"),
    blockQuote([paragraph([text("quoted")])]),
    list(true, 3, true, ListDelimiter.Period, [
        listItem([paragraph([text("first")])]),
        listItem([paragraph([text("second")])])
    ])
]);

type Doc = typeof doc;
type Expected = "---\n\n## Hi *there*\n\nA **bold** `c` [t](u)\n\n```js\nx=1\n```\n\n> quoted\n\n3. first\n4. second";

// The ordered list numbers from its `start` (3, 4) and the twin renders the exact source `serialize` produces.
export type Rendered = Expect<Equal<Serialize<Doc>, Expected>>;

const multi = document([list(false, 1, true, ListMarker.Dash, [listItem([paragraph([text("a")]), paragraph([text("b")])])])]);

// A continuation block re-indents by a pad as wide as the marker (`- ` -> two spaces).
export type Indented = Expect<Equal<Serialize<typeof multi>, "- a\n  \n  b">>;

await test("serialize: the twin renders exactly what the runtime emits", () => {
    const expected: Expected = "---\n\n## Hi *there*\n\nA **bold** `c` [t](u)\n\n```js\nx=1\n```\n\n> quoted\n\n3. first\n4. second";
    assert.equal(serialize(doc), expected);
});

await test("serialize: a multi-line list item aligns its continuation under the marker", () => {
    assert.equal(serialize(multi), "- a\n  \n  b");
});
