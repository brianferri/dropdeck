// The `insert` strings deliberately contain `${n:placeholder}` snippet markers; they are parsed by the editor's
// snippet engine, not interpolated, so the template-curly lint does not apply here.
/* eslint-disable no-template-curly-in-string */
export enum CompletionKind {
    Directive = "directive",
    Fence = "fence",
    Frontmatter = "frontmatter",
    Snippet = "snippet",
    Asset = "asset"
}

// `insert` carries `${n:placeholder}`/`$0` snippet markers; `doc` drives both completions and hover.
export type CompletionItem = {
    readonly label: string,
    readonly insert: string,
    readonly detail: string,
    readonly doc: string,
    readonly kind: CompletionKind
};

export const DIRECTIVES = [
    {
        label: "::right::",
        insert: "::right::\n$0",
        detail: "column split",
        doc: "Splits the slide into two columns: everything before `::right::` is the left column, everything after is the right. It stands alone -- there is no `::left::`.",
        kind: CompletionKind.Directive
    }
] as const;

// These two langs render as components rather than code blocks.
export const FENCES = [
    {
        label: "metrics",
        insert: "metrics\n${1:42} | ${2:label} | ${3:detail}\n```\n$0",
        detail: "metric grid",
        doc: "A grid of big-number stats. Each row is `value | label | sub`; whole-number values count up on reveal.",
        kind: CompletionKind.Fence
    },
    {
        label: "bars",
        insert: "bars\n${1:Label} | ${2:tag} | ${3:60}\n```\n$0",
        detail: "bar chart",
        doc: "A horizontal bar chart. Each row is `label | tag | percent` (0-100); bars grow on slide entry.",
        kind: CompletionKind.Fence
    }
] as const;

function colorKey(label: string, doc: string): CompletionItem {
    return { label, insert: `${label}: \${0:#5cd0b3}`, detail: "colour", doc, kind: CompletionKind.Frontmatter };
}

// Mirror `theme.ts`'s keys -- a key the theme ignores would be a misleading suggestion.
export const FRONTMATTER = [
    colorKey("accent", "Primary accent colour -- headings, links, the particle hue."),
    colorKey("accent2", "Secondary accent colour."),
    colorKey("accent3", "Tertiary accent colour (alias of `highlight`)."),
    colorKey("highlight", "Highlight colour, used as the tertiary accent."),
    colorKey("bg", "Slide background colour."),
    colorKey("text", "Primary text colour."),
    colorKey("textSecondary", "Secondary text colour."),
    colorKey("muted", "Muted text colour."),
    colorKey("surface", "Card/surface fill colour."),
    colorKey("border", "Surface border colour."),
    colorKey("track", "Bar/progress track colour."),
    {
        label: "dark",
        insert: "dark: ${0:true}",
        detail: "dark palette",
        doc: "Switches to the dark palette when `true`.",
        kind: CompletionKind.Frontmatter
    },
    {
        label: "theme",
        insert: "theme: ${0:dark}",
        detail: "palette",
        doc: "Set to `dark` for the dark palette (same effect as `dark: true`).",
        kind: CompletionKind.Frontmatter
    },
    {
        label: "font",
        insert: "font: ${0:Inter}",
        detail: "body font",
        doc: "Body font family (alias of `sans`).",
        kind: CompletionKind.Frontmatter
    },
    {
        label: "titleFont",
        insert: "titleFont: ${0:Fraunces}",
        detail: "display font",
        doc: "Display font for titles (alias of `serif`).",
        kind: CompletionKind.Frontmatter
    },
    {
        label: "mono",
        insert: "mono: ${0:JetBrains Mono}",
        detail: "code font",
        doc: "Monospace font for code blocks.",
        kind: CompletionKind.Frontmatter
    },
    {
        label: "particles",
        insert: "particles: ${0:false}",
        detail: "backdrop",
        doc: "Set `false` to disable the animated particle backdrop.",
        kind: CompletionKind.Frontmatter
    },
    {
        label: "layout",
        insert: "layout: ${0:center}",
        detail: "slide layout",
        doc: "Default slide layout: `center` or `default`.",
        kind: CompletionKind.Frontmatter
    }
] as const;

function valueItem(label: string, doc: string): CompletionItem {
    return { label, insert: label, detail: "value", doc, kind: CompletionKind.Frontmatter };
}

// Keys whose value is a fixed set; the editor offers these once the caret is past the `key:`. Colour keys are
// absent on purpose -- a hex is free-form, and the editor swatches it rather than suggesting from a list.
export const FRONTMATTER_VALUES = {
    layout: [
        valueItem("center", "Center the content as a cover/section slide."),
        valueItem("default", "Top-aligned content layout.")
    ],
    dark: [
        valueItem("true", "Use the dark palette."),
        valueItem("false", "Use the light palette.")
    ],
    theme: [
        valueItem("dark", "Use the dark palette (same effect as `dark: true`)."),
        valueItem("light", "Use the light palette.")
    ],
    colorSchema: [
        valueItem("dark", "Use the dark palette."),
        valueItem("light", "Use the light palette.")
    ],
    particles: [
        valueItem("true", "Show the animated particle backdrop."),
        valueItem("false", "Hide the animated particle backdrop.")
    ]
} as const;

export const SNIPPETS = [
    {
        label: "---",
        insert: "---\n${1:layout}: ${2:center}\n---\n$0",
        detail: "frontmatter",
        doc: "A `---` config block: deck-level config at the top of the file, or a per-slide block placed between two slide separators.",
        kind: CompletionKind.Snippet
    },
    {
        label: "slide",
        insert: "---\n\n# ${1:Title}\n\n$0\n",
        detail: "new slide",
        doc: "A new slide, separated by `---`, with a title.",
        kind: CompletionKind.Snippet
    },
    {
        label: "columns",
        insert: "${1:left}\n\n::right::\n\n${0:right}\n",
        detail: "two columns",
        doc: "Split the slide into left and right columns at `::right::`.",
        kind: CompletionKind.Snippet
    },
    {
        label: "metrics",
        insert: "```metrics\n${1:42} | ${2:label} | ${3:detail}\n```\n$0",
        detail: "metric grid",
        doc: "A grid of big-number stats. Rows: `value | label | sub`.",
        kind: CompletionKind.Snippet
    },
    {
        label: "bars",
        insert: "```bars\n${1:Label} | ${2:tag} | ${3:60}\n```\n$0",
        detail: "bar chart",
        doc: "A horizontal bar chart. Rows: `label | tag | percent`.",
        kind: CompletionKind.Snippet
    },
    {
        label: "card",
        insert: "### ${1:Card title}\n${0:Body text}\n",
        detail: "card",
        doc: "A `###` card; consecutive cards lay out as a grid.",
        kind: CompletionKind.Snippet
    },
    {
        label: "frontmatter",
        insert: "---\n${1:accent}: ${2:#5cd0b3}\n---\n\n$0",
        detail: "deck config",
        doc: "A deck-level config block at the top of the file.",
        kind: CompletionKind.Snippet
    }
] as const;

// Maps a highlighted directive/fence span back to its registry entry, so the same docs drive hover and completions.
export function describe(spanText: string): CompletionItem | null {
    const trimmed = spanText.trim();
    for (const directive of DIRECTIVES) if (directive.label === trimmed) return directive;
    const fenceLang = trimmed.startsWith("```") ? trimmed.slice(3).trim() : trimmed;
    for (const fence of FENCES) if (fence.label === fenceLang) return fence;
    return null;
}
