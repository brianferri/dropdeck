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

---

# A curve, plotted

<svg data-morph="plot" viewBox="0 0 260 160" width="440" height="271">
  <line x1="30" y1="20" x2="30" y2="140" stroke="#3a4568" stroke-width="2" />
  <line x1="30" y1="80" x2="240" y2="80" stroke="#3a4568" stroke-width="2" />
  <polyline points="30,132 38.8,127.7 47.5,123.3 56.3,119 65,114.7 73.8,110.3 82.5,106 91.3,101.7 100,97.3 108.8,93 117.5,88.7 126.3,84.3 135,80 143.8,75.7 152.5,71.3 161.3,67 170,62.7 178.8,58.3 187.5,54 196.3,49.7 205,45.3 213.8,41 222.5,36.7 231.3,32.3 240,28" fill="none" stroke="#7c9cff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</svg>

A straight line `y = x` over a pair of axes, sampled at 25 points.
---
transition: morph
---

# ...bends into a sine

<svg data-morph="plot" viewBox="0 0 260 160" width="440" height="271">
  <line x1="30" y1="20" x2="30" y2="140" stroke="#3a4568" stroke-width="2" />
  <line x1="30" y1="80" x2="240" y2="80" stroke="#3a4568" stroke-width="2" />
  <polyline points="30,80 38.8,66.5 47.5,54 56.3,43.2 65,35 73.8,29.8 82.5,28 91.3,29.8 100,35 108.8,43.2 117.5,54 126.3,66.5 135,80 143.8,93.5 152.5,106 161.3,116.8 170,125 178.8,130.2 187.5,132 196.3,130.2 205,125 213.8,116.8 222.5,106 231.3,93.5 240,80" fill="none" stroke="#5cd0b3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</svg>

Each sample eases to `sin` one-to-one, so the line waves without a cut.
---
transition: morph
---

# ...slides to a cosine

<svg data-morph="plot" viewBox="0 0 260 160" width="440" height="271">
  <line x1="30" y1="20" x2="30" y2="140" stroke="#3a4568" stroke-width="2" />
  <line x1="30" y1="80" x2="240" y2="80" stroke="#3a4568" stroke-width="2" />
  <polyline points="30,28 38.8,29.8 47.5,35 56.3,43.2 65,54 73.8,66.5 82.5,80 91.3,93.5 100,106 108.8,116.8 117.5,125 126.3,130.2 135,132 143.8,130.2 152.5,125 161.3,116.8 170,106 178.8,93.5 187.5,80 196.3,66.5 205,54 213.8,43.2 222.5,35 231.3,29.8 240,28" fill="none" stroke="#7c9cff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</svg>

A quarter-turn phase shift: every vertex crosses to its cosine height.
---
transition: morph
---

# ...settles in a parabola

<svg data-morph="plot" viewBox="0 0 260 160" width="440" height="271">
  <line x1="30" y1="20" x2="30" y2="140" stroke="#3a4568" stroke-width="2" />
  <line x1="30" y1="80" x2="240" y2="80" stroke="#3a4568" stroke-width="2" />
  <polyline points="30,28 38.8,44.6 47.5,59.8 56.3,73.5 65,85.8 73.8,96.6 82.5,106 91.3,113.9 100,120.4 108.8,125.5 117.5,129.1 126.3,131.3 135,132 143.8,131.3 152.5,129.1 161.3,125.5 170,120.4 178.8,113.9 187.5,106 196.3,96.6 205,85.8 213.8,73.5 222.5,59.8 231.3,44.6 240,28" fill="none" stroke="#f7d96f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</svg>

The axes never move -- only the plotted `polyline` reshapes.
---

# A bar chart, live

<svg data-morph="bars" viewBox="0 0 260 160" width="440" height="271">
  <line x1="14" y1="140" x2="246" y2="140" stroke="#3a4568" stroke-width="2" />
  <rect x="22" y="90" width="34" height="50" rx="4" fill="#4a5a8f" />
  <rect x="66" y="55" width="34" height="85" rx="4" fill="#4a5a8f" />
  <rect x="110" y="100" width="34" height="40" rx="4" fill="#4a5a8f" />
  <rect x="154" y="30" width="34" height="110" rx="4" fill="#f7d96f" />
  <rect x="198" y="75" width="34" height="65" rx="4" fill="#4a5a8f" />
</svg>

Five `rect` bars; the tallest wears the accent.
---
transition: morph
---

# New quarter, new data

<svg data-morph="bars" viewBox="0 0 260 160" width="440" height="271">
  <line x1="14" y1="140" x2="246" y2="140" stroke="#3a4568" stroke-width="2" />
  <rect x="22" y="45" width="34" height="95" rx="4" fill="#4a5a8f" />
  <rect x="66" y="85" width="34" height="55" rx="4" fill="#4a5a8f" />
  <rect x="110" y="20" width="34" height="120" rx="4" fill="#f7d96f" />
  <rect x="154" y="70" width="34" height="70" rx="4" fill="#4a5a8f" />
  <rect x="198" y="55" width="34" height="85" rx="4" fill="#4a5a8f" />
</svg>

Each bar grows or shrinks to its new height and the highlight follows the leader.
---
transition: morph
---

# And again

<svg data-morph="bars" viewBox="0 0 260 160" width="440" height="271">
  <line x1="14" y1="140" x2="246" y2="140" stroke="#3a4568" stroke-width="2" />
  <rect x="22" y="70" width="34" height="70" rx="4" fill="#4a5a8f" />
  <rect x="66" y="40" width="34" height="100" rx="4" fill="#4a5a8f" />
  <rect x="110" y="80" width="34" height="60" rx="4" fill="#4a5a8f" />
  <rect x="154" y="50" width="34" height="90" rx="4" fill="#4a5a8f" />
  <rect x="198" y="25" width="34" height="115" rx="4" fill="#f7d96f" />
</svg>

Heights and fills both interpolate, so the ranking reshuffles smoothly.
---

# Letters, too

<svg data-morph="letter" viewBox="0 0 160 150" width="300" height="281">
  <polyline points="40,120 40,30 80,75 120,120 120,30" fill="none" stroke="#7c9cff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
</svg>

A capital `N` as one five-point stroke.
---
transition: morph
---

# N to M

<svg data-morph="letter" viewBox="0 0 160 150" width="300" height="281">
  <polyline points="40,120 40,30 80,75 120,30 120,120" fill="none" stroke="#5cd0b3" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
</svg>

Same five vertices, two swap corners -- the stroke folds into an `M`.
---
transition: morph
---

# M to Z

<svg data-morph="letter" viewBox="0 0 160 150" width="300" height="281">
  <polyline points="40,30 120,30 80,75 40,120 120,120" fill="none" stroke="#f7d96f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
</svg>

The vertices cross again and the glyph reads as a `Z`.
---

# And into 3D

<svg data-morph="cube" viewBox="0 0 220 200" width="360" height="327">
  <line x1="70.7" y1="46.9" x2="149.3" y2="46.9" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="149.3" y1="46.9" x2="144.3" y2="114.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="144.3" y1="114.2" x2="75.7" y2="114.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="75.7" y1="114.2" x2="70.7" y2="46.9" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="55.8" y1="77.6" x2="164.2" y2="77.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="164.2" y1="77.6" x2="155.1" y2="161" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="155.1" y1="161" x2="64.9" y2="161" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="64.9" y1="161" x2="55.8" y2="77.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="70.7" y1="46.9" x2="55.8" y2="77.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="149.3" y1="46.9" x2="164.2" y2="77.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="144.3" y1="114.2" x2="155.1" y2="161" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="75.7" y1="114.2" x2="64.9" y2="161" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
</svg>

Twelve `line` edges of a wire-frame cube, projected flat.
---
transition: morph
---

# Turning

<svg data-morph="cube" viewBox="0 0 220 200" width="360" height="327">
  <line x1="63.9" y1="41.8" x2="134.2" y2="50.3" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="134.2" y1="50.3" x2="116.2" y2="113.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="116.2" y1="113.6" x2="51.7" y2="115.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="51.7" y1="115.6" x2="63.9" y2="41.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="98.9" y1="75.9" x2="182.9" y2="80.4" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="182.9" y1="80.4" x2="154" y2="155.5" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="154" y1="155.5" x2="77.7" y2="166.3" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="77.7" y1="166.3" x2="98.9" y2="75.9" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="63.9" y1="41.8" x2="98.9" y2="75.9" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="134.2" y1="50.3" x2="182.9" y2="80.4" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="116.2" y1="113.6" x2="154" y2="155.5" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="51.7" y1="115.6" x2="77.7" y2="166.3" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
</svg>

Each keyframe spins the cube 30 degrees; the edge endpoints tween between them.
---
transition: morph
---

# Turning

<svg data-morph="cube" viewBox="0 0 220 200" width="360" height="327">
  <line x1="69.5" y1="36.2" x2="115.1" y2="51.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="115.1" y1="51.8" x2="87.6" y2="113.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="87.6" y1="113.8" x2="37.5" y2="117.9" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="37.5" y1="117.9" x2="69.5" y2="36.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="147.9" y1="76.6" x2="178" y2="83.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="178" y1="83.2" x2="142.5" y2="151.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="142.5" y1="151.2" x2="102.7" y2="169.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="102.7" y1="169.2" x2="147.9" y2="76.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="69.5" y1="36.2" x2="147.9" y2="76.6" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="115.1" y1="51.8" x2="178" y2="83.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="87.6" y1="113.8" x2="142.5" y2="151.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="37.5" y1="117.9" x2="102.7" y2="169.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
</svg>

The flat interpolation of projected corners reads as depth.
---
transition: morph
---

# Turning

<svg data-morph="cube" viewBox="0 0 220 200" width="360" height="327">
  <line x1="89.2" y1="31.8" x2="95.1" y2="51.3" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="95.1" y1="51.3" x2="61.3" y2="114.9" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="61.3" y1="114.9" x2="41.8" y2="120.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="41.8" y1="120.8" x2="89.2" y2="31.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="178.2" y1="79.2" x2="158.7" y2="85.1" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="158.7" y1="85.1" x2="124.9" y2="148.7" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="124.9" y1="148.7" x2="130.8" y2="168.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="130.8" y1="168.2" x2="178.2" y2="79.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="89.2" y1="31.8" x2="178.2" y2="79.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="95.1" y1="51.3" x2="158.7" y2="85.1" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="61.3" y1="114.9" x2="124.9" y2="148.7" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="41.8" y1="120.8" x2="130.8" y2="168.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
</svg>

A quarter turn, entirely in SVG attributes -- no 3D transform.
---
transition: morph
---

# Turning

<svg data-morph="cube" viewBox="0 0 220 200" width="360" height="327">
  <line x1="117.3" y1="30.8" x2="77.5" y2="48.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="77.5" y1="48.8" x2="42" y2="116.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="42" y1="116.8" x2="72.1" y2="123.4" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="72.1" y1="123.4" x2="117.3" y2="30.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="182.5" y1="82.1" x2="132.4" y2="86.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="132.4" y1="86.2" x2="104.9" y2="148.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="104.9" y1="148.2" x2="150.5" y2="163.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="150.5" y1="163.8" x2="182.5" y2="82.1" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="117.3" y1="30.8" x2="182.5" y2="82.1" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="77.5" y1="48.8" x2="132.4" y2="86.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="42" y1="116.8" x2="104.9" y2="148.2" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="72.1" y1="123.4" x2="150.5" y2="163.8" stroke="#7c9cff" stroke-width="2.5" stroke-linecap="round" />
</svg>

Still just points and lines, morphing.
