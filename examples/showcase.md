---
dark: true
accent: "#58c4dd"
accent2: "#5cd0b3"
highlight: "#f7d96f"
mono: "JetBrains Mono"
---

📊

# A whole deck, written in Markdown

Everything on these slides is plain text.

Drop the file, present in your browser.

---

# What you can write

### Headings
A `#` becomes the slide title; `###` blocks become a grid of cards.

### Lists and tables
Plain Markdown, styled for you automatically.

### Code
Fenced blocks render in a monospace card.

---

# A clear story, fast

```metrics
3 | Build stages | lexer, parser, renderer
100% | Offline | runs from a single file
0 | Setup to view | just open the HTML
```

- Drop a file and it renders instantly.
- Edit the text, drop it again, and it updates.
- Refresh the page to choose another deck.

---

# Show the proportions

```bars
Parsing | fast | 32
Rendering | fast | 24
Everything else | tiny | 8
```

- Bars grow when you enter the slide.
- Whole-number stats count up.
- Embedded video plays only on its own slide.

---

# Code beside prose

```ts
export function compile(source: string) {
    const deck = parse(source);
    return { deck, diagnostics: check(deck) };
}
```

::right::

Whatever comes before `::right::` is the left column.

Everything after it is the right column.

Use it for **code beside an explanation**, or two lists side by side.

---

# Blocks at a glance

| Block | You write | You get |
| --- | --- | --- |
| Card | a `###` heading | a panel in a grid |
| Metric | a `metrics` fence | a big-number stat |
| Bar | a `bars` fence | an animated bar |
| Code | any other fence | a monospace card |

---

# Theme it your way

> Set colors and fonts in a small front-matter block at the top. Light or dark, your accent, your typeface.

The background, accents, particles, and code font all follow your theme.

---

🎬

# Your turn

Drop your own Markdown to begin.
