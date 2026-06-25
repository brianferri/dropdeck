import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUnicodeRange, unicodeRangeCovers } from "../../src/css/UnicodeRange.js";

await test("parseUnicodeRange: single, range and wildcard entries", () => {
    assert.deepEqual(parseUnicodeRange("U+0000-00FF, U+0131, U+0152-0153"), [[0, 255], [305, 305], [338, 339]]);
    assert.deepEqual(parseUnicodeRange("U+00??"), [[0, 255]]);
    assert.deepEqual(parseUnicodeRange("U+4??"), [[1024, 1279]]);
});

await test("unicodeRangeCovers: a code point inside any range", () => {
    const latin = parseUnicodeRange("U+0000-00FF, U+0131");
    assert.equal(unicodeRangeCovers(latin, "A".codePointAt(0) ?? 0), true);
    assert.equal(unicodeRangeCovers(latin, 0x0131), true);
    assert.equal(unicodeRangeCovers(latin, 0x0400), false);
});
