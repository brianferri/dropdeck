layout: center

---

# Magic Move

```metrics
2 | Export targets | HTML and PowerPoint
3 | Build stages | lexer, parser, renderer
```

---
transition: morph
---

# Magic Move

One spec, two export targets.

```bars
Shared spec | done | 100
Morph spike | now | 65
```

---
transition: morph
---

# Magic Move

One spec, two export targets.

The title and the line above are unchanged, so both morph and hold their place; only the panel below swaps. A
component with its own motion -- the metrics counter -- runs instead of morphing.

```metrics
48 | Tests | green
0 | Warnings | clean
```

---

# Fly across

One picture, keyed by its `src`.

<img src="assets/logo.png" width="200" height="200" style="transform: translate(-320px, 70px) rotate(-20deg) scale(0.5)">

---
transition: morph
---

# Fly across

One `src`, a new transform.

<img src="assets/logo.png" width="200" height="200" style="transform: translate(300px, 55px) rotate(14deg) scale(1.05)">


---

# Entrance effects

A plain fade slide -- no morph, so each component animates on its own as it arrives.

```bars
Parsing | fast | 90
Rendering | fast | 70
```

---
transition: none
---

# Instant cut

`transition: none` swaps with no animation at all -- the third slide-level behaviour.
