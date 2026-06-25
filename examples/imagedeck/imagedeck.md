---
dark: true
accent: "#5cd0b3"
accent2: "#0f766e"
highlight: "#f7d96f"
---

# Images that travel with the deck

Drop this whole folder -- the Markdown and its `assets/` ride along, so every
picture resolves in your browser.

---

# A full-width image

A plain Markdown image, referenced by its path relative to this file:

![A bar chart](assets/chart.png)

---

# Side by side

The logo is a raw `<img>` tag, sized with an attribute.

<img src="assets/logo.png" alt="Mint disc logo" width="240">

::right::

### Same bytes, no server
The image lives only in your browser as a blob URL once you drop the folder --
nothing is uploaded anywhere.

### Exports keep it
Export to offline HTML or PowerPoint and the picture is baked right in.

---

# Paths are explicit

Every image is referenced by its exact path relative to this file -- like
`assets/cover.png` below. No guessing by filename.

![A diagonal wash](assets/cover.png)

---

# Code stays code

A path shown inside a fenced block is left exactly as written, never rewritten:

```html
<img src="assets/logo.png">
```

That's it -- drop the `imagedeck` folder and present.
