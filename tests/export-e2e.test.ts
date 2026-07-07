import { test, expect } from "vitest";
import { toBytes } from "@dropdeck/pptx";
import { parse } from "#/front/parser";
import { renderDeckHtml } from "#/export/html";
import { lowerDeck } from "#/export/pptx";

// One deck that exercises every block kind, so a single render/lower drives the whole export pipeline.
const DECK = `---
dark: true
---

# Title slide

Intro prose with **bold**.

---

# Stats

\`\`\`metrics
42 | Answer | detail
\`\`\`

\`\`\`bars
Alpha | 95% | 95
\`\`\`

---

# Grouped bars

\`\`\`chart
 | A | B
Jan | 120 | 90
Feb | 240 | 200
\`\`\`

---

# Stacked

\`\`\`chart stacked
 | A | B
Q1 | 80 | 40
Q2 | 110 | 70
\`\`\`

---

# Share

\`\`\`chart pie
 | Share
Mobile | 60
Desktop | 40
\`\`\`

---

### Card A
body a

### Card B
body b

---

::right::
right column

---

\`\`\`ts
const x = 1;
\`\`\`
`;

test("renderDeckHtml renders a full multi-block deck to HTML", () => {
    const html = renderDeckHtml(parse(DECK), false, new Map());
    expect(html).toContain("Title slide");
    expect(html).toContain("metric");
    expect(html).toContain("bar-fill");
    expect(html).toContain("chart-bar");
    expect(html).toContain("chart-stack");
    expect(html).toContain("chart-pie");
    expect(html).toContain("code-block");
    expect(html.length).toBeGreaterThan(2000);
});

test("lowerDeck lowers the same deck to a valid pptx byte stream", async () => {
    const bytes = await toBytes(lowerDeck(parse(DECK), new Map()));
    // A .pptx is a zip archive -- check the PK magic bytes and a plausible size.
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes.length).toBeGreaterThan(4000);
});
