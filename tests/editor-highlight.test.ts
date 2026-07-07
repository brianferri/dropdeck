import { test, expect } from "vitest";
import { highlight } from "#/host/editor";

test("block tokens are wrapped in their kind's token class", () => {
    expect(highlight("# Title\n")).toContain("tok-heading");
    expect(highlight("> quote\n")).toContain("tok-quote");
    expect(highlight("- item\n")).toContain("tok-list");
    expect(highlight("---\n")).toContain("tok-separator");
});

test("inline emphasis, code, links, and images each get their own class", () => {
    expect(highlight("a **bold** b\n")).toContain("tok-bold");
    expect(highlight("a *em* b\n")).toContain("tok-italic");
    expect(highlight("a `code` b\n")).toContain("tok-code");
    expect(highlight("a [label](url) b\n")).toContain("tok-link");
    expect(highlight("a ![alt](url) b\n")).toContain("tok-image");
});

test("a bare hex colour is swatched, and its ink contrasts the background", () => {
    const dark = highlight("#000\n");
    expect(dark).toContain("tok-color");
    expect(dark).toContain("background-color: #000");
    expect(dark).toContain("color: #fff");
    expect(highlight("#fff\n")).toContain("color: #000");
});

test("a hash followed by a non-hex letter is an id, not a colour", () => {
    expect(highlight("#header\n")).not.toContain("tok-color");
});

test("a ::name:: directive is recognised as a dropdeck extension", () => {
    expect(highlight("::right::\n")).toContain("tok-directive");
});

test("a code fence tags its markers and leaves the body literal", () => {
    const out = highlight("```ts\n**not bold**\n```\n");
    expect(out).toContain("tok-fence");
    expect(out).not.toContain("tok-bold");
});
