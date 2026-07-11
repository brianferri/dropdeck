// The `insert` strings deliberately contain `${n:placeholder}` snippet markers; they are parsed by the editor's
// snippet engine, not interpolated, so the template-curly lint does not apply here.
/* eslint-disable no-template-curly-in-string */
import { ChartKind } from "#/ir";
import type { SlideTransition } from "#/animations/spec";
import type { LayoutHint } from "#/config";

export enum CompletionKind {
    Directive = "directive",
    Fence = "fence",
    Frontmatter = "frontmatter",
    Snippet = "snippet",
    Asset = "asset",
    Math = "math",
    Latex = "latex"
}

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
        doc: "Splits the slide into columns: each `::right::` starts the next column, and the text before the first is already the first column.",
        kind: CompletionKind.Directive
    }
] as const;

// Detail and doc per chart kind; the completions and their inserts are generated from `ChartKind`, so a new kind
// surfaces in the editor automatically.
const CHART_KIND_INFO = {
    [ChartKind.Bars]: { detail: "grouped bar chart", doc: "Grouped bars with a value axis. The header row names the series; each later row is `category | value | ...`, one number per series." },
    [ChartKind.Stacked]: { detail: "stacked bar chart", doc: "Series stacked into one bar per category; same data shape as `chart`, and the axis scales to the tallest total." },
    [ChartKind.Line]: { detail: "line chart", doc: "One polyline per series over the categories -- good for trends read left to right." },
    [ChartKind.Area]: { detail: "area chart", doc: "Like `chart line` but filled beneath each series; reads as cumulative volume." },
    [ChartKind.Pie]: { detail: "pie chart", doc: "The first series drawn as slices, each sized by its share of the total." }
} as const satisfies Record<ChartKind, { detail: string, doc: string }>;

// Bare `chart` is the grouped bar chart; the others carry their kind as `chart <type>`. Pie reads a single series.
function chartFence(kind: ChartKind): CompletionItem {
    const tag = kind === ChartKind.Bars ? "chart" : `chart ${kind}`;
    const data = kind === ChartKind.Pie
        ? " | ${1:Share}\n${2:Mobile} | ${3:60}\n${4:Desktop} | ${5:30}"
        : " | ${1:Series}\n${2:Jan} | ${3:120}\n${4:Feb} | ${5:180}";
    const info = CHART_KIND_INFO[kind];
    return { label: tag, insert: `${tag}\n${data}\n\`\`\`\n$0`, detail: info.detail, doc: info.doc, kind: CompletionKind.Fence };
}

const FENCE_ROWS: ReadonlyArray<CompletionItem> = [
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
    },
    {
        label: "math",
        insert: "math\n${1:x^2}\n```\n$0",
        detail: "math formula",
        doc: "A formula in the `math` language (semantic: `a/b` divides, `x^2` powers, `sqrt(x)` calls). Renders as native MathML in HTML and an editable equation in PowerPoint.",
        kind: CompletionKind.Fence
    },
    {
        label: "latex",
        insert: "latex\n${1:\\frac{a}{b}}\n```\n$0",
        detail: "LaTeX formula",
        doc: "A formula in `latex` (presentational: `\\frac{a}{b}`, `x^2`, `\\sqrt{x}`). Renders as native MathML in HTML and an editable equation in PowerPoint.",
        kind: CompletionKind.Fence
    }
];

export const FENCES: ReadonlyArray<CompletionItem> = FENCE_ROWS.concat(Object.values(ChartKind).map(chartFence));

function mathToken(label: string, insert: string, doc: string): CompletionItem {
    return { label, insert, detail: "math", doc, kind: CompletionKind.Math };
}

// Operators (`+ - * / ^ == <= >= != and or`) are typed directly, so only functions and constants complete.
export const MATH_TOKENS: ReadonlyArray<CompletionItem> = [
    mathToken("sqrt", "sqrt(${1:x})$0", "Square root, rendered as a radical."),
    mathToken("sin", "sin(${1:x})$0", "Sine, rendered as `sin(x)`."),
    mathToken("cos", "cos(${1:x})$0", "Cosine, rendered as `cos(x)`."),
    mathToken("tan", "tan(${1:x})$0", "Tangent, rendered as `tan(x)`."),
    mathToken("log", "log(${1:x})$0", "Logarithm, rendered as `log(x)`."),
    mathToken("ln", "ln(${1:x})$0", "Natural logarithm, rendered as `ln(x)`."),
    mathToken("exp", "exp(${1:x})$0", "Exponential, rendered as `exp(x)`."),
    mathToken("abs", "abs(${1:x})$0", "Absolute value, rendered as `abs(x)`."),
    mathToken("pi", "pi", "The constant π."),
    mathToken("e", "e", "Euler's number e."),
    mathToken("tau", "tau", "The constant τ (2π).")
];

function latexCommand(label: string, insert: string, doc: string): CompletionItem {
    return { label, insert, detail: "latex", doc, kind: CompletionKind.Latex };
}

export const LATEX_COMMANDS: ReadonlyArray<CompletionItem> = [
    latexCommand("\\frac", "\\frac{${1:a}}{${2:b}}$0", "A fraction, a over b."),
    latexCommand("\\sqrt", "\\sqrt{${1:x}}$0", "A square root; `\\sqrt[n]{x}` for an nth root."),
    latexCommand("\\cdot", "\\cdot", "Multiplication dot ·."),
    latexCommand("\\times", "\\times", "Multiplication cross ×."),
    latexCommand("\\div", "\\div", "Division sign ÷."),
    latexCommand("\\pm", "\\pm", "Plus-minus ±."),
    latexCommand("\\mp", "\\mp", "Minus-plus ∓."),
    latexCommand("\\le", "\\le", "Less than or equal ≤."),
    latexCommand("\\ge", "\\ge", "Greater than or equal ≥."),
    latexCommand("\\ne", "\\ne", "Not equal ≠."),
    latexCommand("\\approx", "\\approx", "Approximately equal ≈."),
    latexCommand("\\equiv", "\\equiv", "Identical to ≡."),
    latexCommand("\\land", "\\land", "Logical and ∧."),
    latexCommand("\\lor", "\\lor", "Logical or ∨."),
    latexCommand("\\to", "\\to", "Right arrow →."),
    latexCommand("\\mapsto", "\\mapsto", "Maps-to arrow ↦."),
    latexCommand("\\in", "\\in", "Set membership ∈."),
    latexCommand("\\cup", "\\cup", "Set union ∪."),
    latexCommand("\\cap", "\\cap", "Set intersection ∩."),
    latexCommand("\\alpha", "\\alpha", "The Greek letter α."),
    latexCommand("\\beta", "\\beta", "The Greek letter β."),
    latexCommand("\\gamma", "\\gamma", "The Greek letter γ."),
    latexCommand("\\delta", "\\delta", "The Greek letter δ."),
    latexCommand("\\theta", "\\theta", "The Greek letter θ."),
    latexCommand("\\lambda", "\\lambda", "The Greek letter λ."),
    latexCommand("\\mu", "\\mu", "The Greek letter μ."),
    latexCommand("\\pi", "\\pi", "The Greek letter π."),
    latexCommand("\\sigma", "\\sigma", "The Greek letter σ."),
    latexCommand("\\phi", "\\phi", "The Greek letter φ."),
    latexCommand("\\omega", "\\omega", "The Greek letter ω."),
    latexCommand("\\tau", "\\tau", "The Greek letter τ.")
];

function colorKey(label: string, doc: string): CompletionItem {
    return { label, insert: `${label}: \${0:#5cd0b3}`, detail: "colour", doc, kind: CompletionKind.Frontmatter };
}

const LAYOUT_DOC = {
    center: "Center the content as a cover/section slide.",
    default: "Top-aligned content layout."
} as const satisfies Record<LayoutHint, string>;

const TRANSITION_DOC = {
    none: "Swap instantly, with no animation.",
    fade: "Cross-fade from the previous slide (the default).",
    morph: "Tween the elements this slide shares with the previous one between their two positions."
} as const satisfies Record<SlideTransition, string>;

function keyList(docs: Record<string, string>): string {
    const keys = Object.keys(docs).map((key) => `\`${key}\``);
    if (keys.length <= 2) return keys.join(" or ");
    return `${keys.slice(0, -1).join(", ")}, or ${keys[keys.length - 1]}`;
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
        doc: `Default slide layout: ${keyList(LAYOUT_DOC)}.`,
        kind: CompletionKind.Frontmatter
    },
    {
        label: "transition",
        insert: "transition: ${0:morph}",
        detail: "slide transition",
        doc: `How this slide arrives: ${keyList(TRANSITION_DOC)}.`,
        kind: CompletionKind.Frontmatter
    }
] as const;

function valueItem(label: string, doc: string): CompletionItem {
    return { label, insert: label, detail: "value", doc, kind: CompletionKind.Frontmatter };
}

function enumItems(docs: Record<string, string>): ReadonlyArray<CompletionItem> {
    return Object.entries(docs).map(([value, doc]) => valueItem(value, doc));
}

// Keys whose value is a fixed set; the editor offers these once the caret is past the `key:`. Colour keys are
// absent on purpose -- a hex is free-form, and the editor swatches it rather than suggesting from a list.
export const FRONTMATTER_VALUES = {
    layout: enumItems(LAYOUT_DOC),
    transition: enumItems(TRANSITION_DOC),
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
};

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

export function describe(spanText: string): CompletionItem | null {
    const trimmed = spanText.trim();
    for (const directive of DIRECTIVES) if (directive.label === trimmed) return directive;
    const fenceLang = trimmed.startsWith("```") ? trimmed.slice(3).trim() : trimmed;
    for (const fence of FENCES) if (fence.label === fenceLang) return fence;
    return null;
}
