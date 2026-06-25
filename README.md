# dropdeck

Drop a Markdown file, get a presentation.

A self-contained, themeable deck renderer that builds to a single `index.html`.

---

## Use

```sh
npm install
npm run dev      # live dev server
npm run build    # -> dist/index.html (one self-contained file)
npm run check    # tsc --noEmit && eslint
```

Open the built `dist/index.html`, drop a `.md` file, and present. Click the
right half of a slide to advance, the left half to go back; arrows and swipes
work too. Refresh to pick a different file.

---

## Slides

Separate slides with a line containing only `---`. The first `#` heading is the
slide title. The first and last prose-only slides become a centered cover and
closing automatically.

> This README is itself a valid deck -- drop `README.md` into dropdeck to
> present these notes.

---

## Blocks

### Cards

`###` headings become a responsive grid of cards.

### Metrics

A `metrics` fence -- `value | label | sub` per line -- becomes big-number
stats that count up.

### Bars

A `bars` fence -- `label | tag | percent` per line -- becomes animated bars.

---

## More blocks

- Tables, lists, blockquotes (callouts), images, and code blocks all render.
- `::right::` splits a slide into two columns.
- A line that is only an emoji becomes a large floating icon.
- Embedded `<video>` / `<audio>` play on slide entry and pause on exit.

---

## Edit and export

Toggle **Edit** for an in-browser editor: syntax-highlighted Markdown with a live
preview that follows your cursor, plus completions (`Up`/`Dn` to move, `Enter` /
`Tab` to accept, `Esc` to dismiss) for config keys, the `::right::` directive,
and `metrics` / `bars` fences -- with snippets and docs on hover.

**Export** the deck as PowerPoint (`.pptx`), PDF, or a standalone HTML file.

---

## Theme

An optional YAML front-matter block at the top of the file sets the theme; every
key is optional.

```yaml
accent:    "#0f766e"
bg:        "#0b1220"
dark:       true
font:       Inter
titleFont:  Georgia
mono:      "JetBrains Mono"
particles:  false
```
