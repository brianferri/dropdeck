---
dark: true
accent: "#7c9cff"
accent2: "#5cd0b3"
highlight: "#f7d96f"
titleFont: Georgia
mono: JetBrains Mono
---

# Inline SVG, keyed to morph

<svg data-morph="glyph" viewBox="0 0 120 120" width="300" height="300">
  <circle cx="60" cy="60" r="18" fill="#7c9cff" />
</svg>

A single core, drawn in Markdown. Tag the `<svg>` with `data-morph` and give the
next slide `transition: morph`.

---
transition: morph
---

# Colour gradients, parts fade in

<svg data-morph="glyph" viewBox="0 0 120 120" width="300" height="300">
  <circle cx="60" cy="60" r="18" fill="#5cd0b3" />
  <circle cx="60" cy="60" r="46" fill="none" stroke="#7c9cff" stroke-width="5" />
</svg>

The core is the same shape, so its fill eases from blue to green. The ring is new
to this slide, so it fades in rather than popping.

---
transition: morph
---

# Recolour and sprout nodes

<svg data-morph="glyph" viewBox="0 0 120 120" width="300" height="300">
  <line x1="60" y1="60" x2="60" y2="18" stroke="#5cd0b3" stroke-width="4" />
  <line x1="60" y1="60" x2="98" y2="84" stroke="#5cd0b3" stroke-width="4" />
  <line x1="60" y1="60" x2="22" y2="84" stroke="#5cd0b3" stroke-width="4" />
  <circle cx="60" cy="60" r="16" fill="#7c9cff" />
  <circle cx="60" cy="60" r="46" fill="none" stroke="#5cd0b3" stroke-width="5" />
  <circle cx="60" cy="18" r="9" fill="#f7d96f" />
  <circle cx="98" cy="84" r="9" fill="#f7d96f" />
  <circle cx="22" cy="84" r="9" fill="#f7d96f" />
</svg>

Core gradients back to blue, the ring's stroke shifts to green, and the three
nodes and their edges fade in.

---
transition: morph
---

# It still tracks into a column

<svg data-morph="glyph" viewBox="0 0 120 120" width="190" height="190">
  <line x1="60" y1="60" x2="60" y2="18" stroke="#5cd0b3" stroke-width="4" />
  <line x1="60" y1="60" x2="98" y2="84" stroke="#5cd0b3" stroke-width="4" />
  <line x1="60" y1="60" x2="22" y2="84" stroke="#5cd0b3" stroke-width="4" />
  <circle cx="60" cy="60" r="16" fill="#7c9cff" />
  <circle cx="60" cy="60" r="46" fill="none" stroke="#5cd0b3" stroke-width="5" />
  <circle cx="60" cy="18" r="9" fill="#f7d96f" />
  <circle cx="98" cy="84" r="9" fill="#f7d96f" />
  <circle cx="22" cy="84" r="9" fill="#f7d96f" />
</svg>
::right::
Drop the same glyph in a `::right::` column and shrink it. The whole SVG glides
from the centre to here while its shapes hold their arrangement.
