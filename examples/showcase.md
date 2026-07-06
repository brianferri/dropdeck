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

# Compare series side by side

```chart
    | Signups | Active
Jan | 120     | 90
Feb | 180     | 130
Mar | 240     | 200
Apr | 210     | 190
```

- The header row names each series.
- Every later row is `category | value | ...`, one number per series.
- Bars scale to a rounded axis maximum.

---

# Stack the parts

```chart stacked
   | Mobile | Desktop | Tablet
Q1 | 80     | 40      | 20
Q2 | 110    | 70      | 30
Q3 | 140    | 90      | 40
Q4 | 160    | 100     | 45
```

- `chart stacked` sums each series into one column.
- The axis scales to the tallest total.
- Good for part-of-whole across categories.

---

# Trend over time

```chart line
    | Signups | Active
Jan | 120     | 90
Feb | 180     | 130
Mar | 240     | 200
Apr | 210     | 190
```

- `chart line` connects each series as a polyline.
- Each point sits at the centre of its category.
- Good for trends read left to right.

---

# Volume under the curve

```chart area
    | Traffic | Converted
Jan | 120     | 40
Feb | 180     | 70
Mar | 240     | 120
Apr | 210     | 95
```

- `chart area` fills beneath each line.
- Overlapping fills stay translucent.
- Reads as cumulative volume.

---

# Share of the whole

```chart pie
        | Share
Mobile  | 60
Desktop | 30
Tablet  | 10
```

- `chart pie` draws the first series as slices.
- Each slice is sized by its share of the total.
- The legend lists the categories.

---

# Code beside prose

```ts
export function compile(source: string) {
    const deck = parse(source);
    return { deck, diagnostics: check(deck) };
}
```
::right::
- Everything before `::right::` is the **left column**.
- Everything after it is the **right column**.
- Great for code beside an explanation, or two lists side by side.

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
