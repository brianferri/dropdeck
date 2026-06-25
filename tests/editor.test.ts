import { expect, test } from "vitest";
import { highlight } from "#/host/editor";

test("a hex colour highlights as a swatch with its own background and contrasting ink", () => {
    // 5cd0b3 is a light mint, so the brightest-weighted YIQ picks black ink to stay legible on it.
    const html = highlight("---\naccent: #5cd0b3\n---\n");
    expect(html).toContain("tok-color");
    expect(html).toContain("background-color: #5cd0b3");
    expect(html).toContain("color: #000");
});

test("a dark hex colour gets white ink instead", () => {
    const html = highlight("bg: #102030");
    expect(html).toContain("background-color: #102030");
    expect(html).toContain("color: #fff");
});

test("a `#` that is not a 3/6-digit colour stays plain, not a swatch", () => {
    // `#abcd` (4 digits) and an id-like `#header` are not colours, so neither paints a swatch.
    expect(highlight("see #abcd here")).not.toContain("tok-color");
    expect(highlight("anchor #header link")).not.toContain("tok-color");
});
