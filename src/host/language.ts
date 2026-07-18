// The `insert` strings deliberately contain `${n:placeholder}` snippet markers; they are parsed by the editor's
// snippet engine, not interpolated, so the template-curly lint does not apply here.
/* eslint-disable no-template-curly-in-string */
import { ChartKind } from "#/ir";
import { COLOR_HEX } from "#/formula";
import { memberGuard } from "@dropdeck/common";
import { MathAccent, MathConstant, MathFunction, MathIntegral, MathLimit } from "@dropdeck/math";
import { LatexAccentCommand } from "@dropdeck/latex";
import { ColorFunction, LimitsFunction, MathVariantFunction } from "#/formula/math";
import { ColorCommand, LatexCommand, LimitsCommand, VariantCommand } from "#/formula/latex";
import type { BigOperatorCommand } from "#/formula/latex";
import type { SlideTransition } from "#/animations/spec";
import type { LayoutHint } from "#/config";

export enum CompletionKind {
    Directive = "directive",
    Fence = "fence",
    Frontmatter = "frontmatter",
    Snippet = "snippet",
    Asset = "asset",
    Math = "math",
    Latex = "latex",
    Color = "color"
}

// `color` holds a CSS color the editor paints as a swatch beside the label; only color completions set it.
export type CompletionItem = {
    readonly label: string,
    readonly insert: string,
    readonly detail: string,
    readonly doc: string,
    readonly kind: CompletionKind,
    readonly color?: string
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

const OPERAND_SNIPPET = "(${1:x})$0";
/** `(i, lo, up, body)`. */
const RANGE_SNIPPET = "(${1:i}, ${2:1}, ${3:n}, ${4:body})$0";

const MATH_FUNCTION_INFO = {
    [MathFunction.Sqrt]: { insert: `sqrt${OPERAND_SNIPPET}`, doc: "Square root, rendered as a radical." },
    [MathFunction.Root]: { insert: "root(${1:n}, ${2:x})$0", doc: "The nth root of x, rendered as a radical with a degree." },
    [MathFunction.Fact]: { insert: "fact(${1:n})$0", doc: "Factorial, rendered as the postfix `n!`." },
    [MathFunction.Sin]: { insert: `sin${OPERAND_SNIPPET}`, doc: "Sine, rendered as `sin(x)`." },
    [MathFunction.Cos]: { insert: `cos${OPERAND_SNIPPET}`, doc: "Cosine, rendered as `cos(x)`." },
    [MathFunction.Tan]: { insert: `tan${OPERAND_SNIPPET}`, doc: "Tangent, rendered as `tan(x)`." },
    [MathFunction.Cot]: { insert: `cot${OPERAND_SNIPPET}`, doc: "Cotangent, rendered as `cot(x)`." },
    [MathFunction.Sec]: { insert: `sec${OPERAND_SNIPPET}`, doc: "Secant, rendered as `sec(x)`." },
    [MathFunction.Csc]: { insert: `csc${OPERAND_SNIPPET}`, doc: "Cosecant, rendered as `csc(x)`." },
    [MathFunction.Arcsin]: { insert: `arcsin${OPERAND_SNIPPET}`, doc: "Inverse sine, rendered as `arcsin(x)`." },
    [MathFunction.Arccos]: { insert: `arccos${OPERAND_SNIPPET}`, doc: "Inverse cosine, rendered as `arccos(x)`." },
    [MathFunction.Arctan]: { insert: `arctan${OPERAND_SNIPPET}`, doc: "Inverse tangent, rendered as `arctan(x)`." },
    [MathFunction.Sinh]: { insert: `sinh${OPERAND_SNIPPET}`, doc: "Hyperbolic sine, rendered as `sinh(x)`." },
    [MathFunction.Cosh]: { insert: `cosh${OPERAND_SNIPPET}`, doc: "Hyperbolic cosine, rendered as `cosh(x)`." },
    [MathFunction.Tanh]: { insert: `tanh${OPERAND_SNIPPET}`, doc: "Hyperbolic tangent, rendered as `tanh(x)`." },
    [MathFunction.Ln]: { insert: `ln${OPERAND_SNIPPET}`, doc: "Natural logarithm, rendered as `ln(x)`." },
    [MathFunction.Exp]: { insert: `exp${OPERAND_SNIPPET}`, doc: "Exponential, rendered as `exp(x)`." },
    [MathFunction.Abs]: { insert: `abs${OPERAND_SNIPPET}`, doc: "Absolute value, rendered as `abs(x)`." },
    [MathFunction.Log]: { insert: "log(${1:2}, ${2:x})$0", doc: "Logarithm; `log(b, x)` renders as log_b(x), `log(x)` is a bare log." },
    [MathFunction.Gcd]: { insert: `gcd${OPERAND_SNIPPET}`, doc: "Greatest common divisor, rendered as `gcd(a, b)`." },
    [MathFunction.Deg]: { insert: `deg${OPERAND_SNIPPET}`, doc: "Degree, rendered as `deg(x)`." },
    [MathFunction.Det]: { insert: `det${OPERAND_SNIPPET}`, doc: "Determinant, rendered as `det(M)`." },
    [MathFunction.Dim]: { insert: `dim${OPERAND_SNIPPET}`, doc: "Dimension, rendered as `dim(V)`." },
    [MathFunction.Ker]: { insert: `ker${OPERAND_SNIPPET}`, doc: "Kernel, rendered as `ker(f)`." },
    [MathFunction.Arg]: { insert: `arg${OPERAND_SNIPPET}`, doc: "Argument, rendered as `arg(z)`." },
    [MathFunction.Sum]: { insert: `sum${RANGE_SNIPPET}`, doc: "Summation ∑ from i=lo to up of body." },
    [MathFunction.Prod]: { insert: `prod${RANGE_SNIPPET}`, doc: "Product ∏ from i=lo to up of body." },
    [MathFunction.Coprod]: { insert: `coprod${RANGE_SNIPPET}`, doc: "Coproduct ∐ from i=lo to up of body." },
    [MathFunction.Bigcup]: { insert: `bigcup${RANGE_SNIPPET}`, doc: "Big union ⋃ from i=lo to up of body." },
    [MathFunction.Bigcap]: { insert: `bigcap${RANGE_SNIPPET}`, doc: "Big intersection ⋂ from i=lo to up of body." },
    [MathFunction.Bigvee]: { insert: `bigvee${RANGE_SNIPPET}`, doc: "Big disjunction ⋁ from i=lo to up of body." },
    [MathFunction.Bigwedge]: { insert: `bigwedge${RANGE_SNIPPET}`, doc: "Big conjunction ⋀ from i=lo to up of body." },
    [MathFunction.Bigoplus]: { insert: `bigoplus${RANGE_SNIPPET}`, doc: "Big direct sum ⨁ from i=lo to up of body." },
    [MathFunction.Bigotimes]: { insert: `bigotimes${RANGE_SNIPPET}`, doc: "Big tensor product ⨂ from i=lo to up of body." },
    [MathFunction.Bigsqcup]: { insert: `bigsqcup${RANGE_SNIPPET}`, doc: "Big square union ⨆ from i=lo to up of body." }
} as const satisfies Record<MathFunction, { insert: string, doc: string }>;

const MATH_INTEGRAL_INFO = {
    [MathIntegral.Int]: { insert: "int(${1:lo}, ${2:hi}, ${3:body})$0", doc: "Integral ∫ from lo to hi of body; `int(body)` for the indefinite form." },
    [MathIntegral.Oint]: { insert: "oint(${1:lo}, ${2:hi}, ${3:body})$0", doc: "Contour integral ∮ from lo to hi of body; `oint(body)` for the indefinite form." },
    [MathIntegral.Iint]: { insert: "iint(${1:lo}, ${2:hi}, ${3:body})$0", doc: "Double integral ∬ from lo to hi of body; `iint(body)` for the indefinite form." },
    [MathIntegral.Iiint]: { insert: "iiint(${1:lo}, ${2:hi}, ${3:body})$0", doc: "Triple integral ∭ from lo to hi of body; `iiint(body)` for the indefinite form." }
} as const satisfies Record<MathIntegral, { insert: string, doc: string }>;

const MATH_LIMIT_INFO = {
    [MathLimit.Lim]: { insert: "lim(${1:sub}, ${2:body})$0", doc: "Limit lim of body with sub as its under-limit (lim_{x→0} f)." },
    [MathLimit.Limsup]: { insert: "limsup(${1:sub}, ${2:body})$0", doc: "Limit superior lim sup of body with sub beneath." },
    [MathLimit.Liminf]: { insert: "liminf(${1:sub}, ${2:body})$0", doc: "Limit inferior lim inf of body with sub beneath." },
    [MathLimit.Sup]: { insert: "sup(${1:sub}, ${2:body})$0", doc: "Supremum sup of body over sub." },
    [MathLimit.Inf]: { insert: "inf(${1:sub}, ${2:body})$0", doc: "Infimum inf of body over sub." },
    [MathLimit.Limmax]: { insert: "limmax(${1:sub}, ${2:body})$0", doc: "Maximum operator max of body over sub; plain `max(a, b)` stays an ordinary call." },
    [MathLimit.Limmin]: { insert: "limmin(${1:sub}, ${2:body})$0", doc: "Minimum operator min of body over sub; plain `min(a, b)` stays an ordinary call." }
} as const satisfies Record<MathLimit, { insert: string, doc: string }>;

const MATH_ACCENT_INFO = {
    [MathAccent.Hat]: { insert: `hat${OPERAND_SNIPPET}`, doc: "Hat accent, rendered as x̂." },
    [MathAccent.Vec]: { insert: `vec${OPERAND_SNIPPET}`, doc: "Vector arrow accent, rendered as x⃗." },
    [MathAccent.Bar]: { insert: `bar${OPERAND_SNIPPET}`, doc: "Bar accent, rendered as x̄." },
    [MathAccent.Tilde]: { insert: `tilde${OPERAND_SNIPPET}`, doc: "Tilde accent, rendered as x̃." },
    [MathAccent.Dot]: { insert: `dot${OPERAND_SNIPPET}`, doc: "Dot accent, rendered as ẋ." },
    [MathAccent.Ddot]: { insert: `ddot${OPERAND_SNIPPET}`, doc: "Double-dot accent, rendered as ẍ." },
    [MathAccent.Overline]: { insert: `overline${OPERAND_SNIPPET}`, doc: "Overline accent, drawn across the operand." }
} as const satisfies Record<MathAccent, { insert: string, doc: string }>;

const MATH_CONSTANT_INFO = {
    [MathConstant.Pi]: "The constant π.",
    [MathConstant.E]: "Euler's number e.",
    [MathConstant.Tau]: "The constant τ (2π).",
    [MathConstant.Alpha]: "The Greek letter α.",
    [MathConstant.Beta]: "The Greek letter β.",
    [MathConstant.Gamma]: "The Greek letter γ.",
    [MathConstant.Delta]: "The Greek letter δ.",
    [MathConstant.Epsilon]: "The Greek letter ε.",
    [MathConstant.Zeta]: "The Greek letter ζ.",
    [MathConstant.Eta]: "The Greek letter η.",
    [MathConstant.Theta]: "The Greek letter θ.",
    [MathConstant.Vartheta]: "The Greek letter ϑ (variant theta).",
    [MathConstant.Iota]: "The Greek letter ι.",
    [MathConstant.Kappa]: "The Greek letter κ.",
    [MathConstant.Lambda]: "The Greek letter λ.",
    [MathConstant.Mu]: "The Greek letter μ.",
    [MathConstant.Nu]: "The Greek letter ν.",
    [MathConstant.Xi]: "The Greek letter ξ.",
    [MathConstant.Rho]: "The Greek letter ρ.",
    [MathConstant.Varrho]: "The Greek letter ϱ (variant rho).",
    [MathConstant.Sigma]: "The Greek letter σ.",
    [MathConstant.Varsigma]: "The Greek letter ς (final sigma).",
    [MathConstant.Upsilon]: "The Greek letter υ.",
    [MathConstant.Phi]: "The Greek letter φ.",
    [MathConstant.Varphi]: "The Greek letter ϕ (variant phi).",
    [MathConstant.Chi]: "The Greek letter χ.",
    [MathConstant.Psi]: "The Greek letter ψ.",
    [MathConstant.Omega]: "The Greek letter ω.",
    [MathConstant.UpperGamma]: "The Greek letter Γ.",
    [MathConstant.UpperDelta]: "The Greek letter Δ.",
    [MathConstant.UpperTheta]: "The Greek letter Θ.",
    [MathConstant.UpperLambda]: "The Greek letter Λ.",
    [MathConstant.UpperXi]: "The Greek letter Ξ.",
    [MathConstant.UpperPi]: "The Greek letter Π.",
    [MathConstant.UpperSigma]: "The Greek letter Σ.",
    [MathConstant.UpperUpsilon]: "The Greek letter Υ.",
    [MathConstant.UpperPhi]: "The Greek letter Φ.",
    [MathConstant.UpperPsi]: "The Greek letter Ψ.",
    [MathConstant.UpperOmega]: "The Greek letter Ω.",
    [MathConstant.Partial]: "The partial derivative symbol ∂.",
    [MathConstant.Nabla]: "The nabla (del) operator ∇.",
    [MathConstant.Infty]: "The infinity symbol ∞.",
    [MathConstant.Hbar]: "The reduced Planck constant ℏ.",
    [MathConstant.Ell]: "The script small letter ℓ.",
    [MathConstant.Aleph]: "The aleph symbol ℵ.",
    [MathConstant.Re]: "The real-part symbol ℜ.",
    [MathConstant.Im]: "The imaginary-part symbol ℑ.",
    [MathConstant.Angle]: "The angle symbol ∠.",
    [MathConstant.Prime]: "The prime symbol ′.",
    [MathConstant.Ldots]: "A low ellipsis …",
    [MathConstant.Cdots]: "A centered ellipsis ⋯",
    [MathConstant.Vdots]: "A vertical ellipsis ⋮",
    [MathConstant.Ddots]: "A diagonal ellipsis ⋱"
} as const satisfies Record<MathConstant, string>;

// Font-variant directives restyle their single argument; each maps to a shared `MathVariant` the renderer emits.
const MATH_VARIANT_INFO = {
    [MathVariantFunction.Bold]: "Bold weight.",
    [MathVariantFunction.Italic]: "Italic shape.",
    [MathVariantFunction.Roman]: "Upright roman shape.",
    [MathVariantFunction.Bolditalic]: "Bold italic.",
    [MathVariantFunction.Bb]: "Blackboard bold, for number sets (ℝ).",
    [MathVariantFunction.Cal]: "Calligraphic script (𝓛).",
    [MathVariantFunction.Frak]: "Fraktur (𝔤).",
    [MathVariantFunction.Sans]: "Sans-serif.",
    [MathVariantFunction.Mono]: "Monospace."
} as const satisfies Record<MathVariantFunction, string>;

const MATH_COLOR_INFO = {
    [ColorFunction.Color]: "Color the second argument the color named by the first (`color(red, x)`)."
} as const satisfies Record<ColorFunction, string>;

// Placement is a style too: these wrap a big operator to override where its bounds sit.
const MATH_LIMITS_INFO = {
    [LimitsFunction.Limits]: "Stack the wrapped big operator's bounds above and below it (`limits(int(a, b, f))`).",
    [LimitsFunction.Nolimits]: "Set the wrapped big operator's bounds beside the sign (`nolimits(sum(i, 1, n, x))`)."
} as const satisfies Record<LimitsFunction, string>;

function mathTokens(): ReadonlyArray<CompletionItem> {
    const out: Array<CompletionItem> = [];
    for (const [name, info] of Object.entries(MATH_FUNCTION_INFO)) out.push(mathToken(name, info.insert, info.doc));
    for (const [name, info] of Object.entries(MATH_INTEGRAL_INFO)) out.push(mathToken(name, info.insert, info.doc));
    for (const [name, info] of Object.entries(MATH_LIMIT_INFO)) out.push(mathToken(name, info.insert, info.doc));
    for (const [name, info] of Object.entries(MATH_ACCENT_INFO)) out.push(mathToken(name, info.insert, info.doc));
    for (const [name, doc] of Object.entries(MATH_VARIANT_INFO)) out.push(mathToken(name, `${name}${OPERAND_SNIPPET}`, doc));
    out.push(mathToken(ColorFunction.Color, "color(${1:red}, ${2:x})$0", MATH_COLOR_INFO[ColorFunction.Color]));
    for (const [name, doc] of Object.entries(MATH_LIMITS_INFO)) out.push(mathToken(name, `${name}(\${1:op})$0`, doc));
    for (const [name, doc] of Object.entries(MATH_CONSTANT_INFO)) out.push(mathToken(name, name, doc));
    return out;
}

export const MATH_TOKENS: ReadonlyArray<CompletionItem> = mathTokens();

function latexCommand(label: string, insert: string, doc: string): CompletionItem {
    return { label, insert, detail: "latex", doc, kind: CompletionKind.Latex };
}

const LATEX_COMMAND_INFO = {
    [LatexCommand.Le]: "Less than or equal ≤.",
    [LatexCommand.Leq]: "Less than or equal ≤ (alias of \\le).",
    [LatexCommand.Ge]: "Greater than or equal ≥.",
    [LatexCommand.Geq]: "Greater than or equal ≥ (alias of \\ge).",
    [LatexCommand.Ne]: "Not equal ≠.",
    [LatexCommand.Neq]: "Not equal ≠ (alias of \\ne).",
    [LatexCommand.Ll]: "Much less than ≪.",
    [LatexCommand.Gg]: "Much greater than ≫.",
    [LatexCommand.Prec]: "Precedes ≺.",
    [LatexCommand.Succ]: "Succeeds ≻.",
    [LatexCommand.Preceq]: "Precedes or equal ⪯.",
    [LatexCommand.Succeq]: "Succeeds or equal ⪰.",
    [LatexCommand.Approx]: "Approximately equal ≈.",
    [LatexCommand.Equiv]: "Identical to ≡.",
    [LatexCommand.Cong]: "Congruent ≅.",
    [LatexCommand.Simeq]: "Asymptotically equal ≃.",
    [LatexCommand.Sim]: "Similar to ∼.",
    [LatexCommand.Asymp]: "Asymptotic to ≍.",
    [LatexCommand.Propto]: "Proportional to ∝.",
    [LatexCommand.Parallel]: "Parallel ∥.",
    [LatexCommand.Mid]: "Divides ∣.",
    [LatexCommand.Perp]: "Perpendicular ⊥.",
    [LatexCommand.In]: "Set membership ∈.",
    [LatexCommand.Notin]: "Not a member ∉.",
    [LatexCommand.Ni]: "Contains as member ∋.",
    [LatexCommand.Cup]: "Set union ∪.",
    [LatexCommand.Cap]: "Set intersection ∩.",
    [LatexCommand.Subset]: "Proper subset ⊂.",
    [LatexCommand.Subseteq]: "Subset or equal ⊆.",
    [LatexCommand.Supset]: "Proper superset ⊃.",
    [LatexCommand.Supseteq]: "Superset or equal ⊇.",
    [LatexCommand.Setminus]: "Set difference ∖.",
    [LatexCommand.Emptyset]: "The empty set ∅.",
    [LatexCommand.Cdot]: "Multiplication dot ·.",
    [LatexCommand.Times]: "Multiplication cross ×.",
    [LatexCommand.Div]: "Division sign ÷.",
    [LatexCommand.Pm]: "Plus-minus ±.",
    [LatexCommand.Mp]: "Minus-plus ∓.",
    [LatexCommand.Ast]: "Asterisk operator ∗.",
    [LatexCommand.Star]: "Star operator ⋆.",
    [LatexCommand.Circ]: "Ring operator ∘.",
    [LatexCommand.Bullet]: "Bullet operator ∙.",
    [LatexCommand.Diamond]: "Diamond operator ⋄.",
    [LatexCommand.Oplus]: "Direct sum ⊕.",
    [LatexCommand.Ominus]: "Circled minus ⊖.",
    [LatexCommand.Otimes]: "Tensor product ⊗.",
    [LatexCommand.Oslash]: "Circled slash ⊘.",
    [LatexCommand.Odot]: "Circled dot ⊙.",
    [LatexCommand.Dagger]: "Dagger †.",
    [LatexCommand.Ddagger]: "Double dagger ‡.",
    [LatexCommand.Sqcup]: "Square union ⊔.",
    [LatexCommand.Sqcap]: "Square intersection ⊓.",
    [LatexCommand.Uplus]: "Multiset union ⊎.",
    [LatexCommand.Land]: "Logical and ∧.",
    [LatexCommand.Lor]: "Logical or ∨.",
    [LatexCommand.Wedge]: "Logical and ∧ (alias of \\land).",
    [LatexCommand.Vee]: "Logical or ∨ (alias of \\lor).",
    [LatexCommand.Neg]: "Logical negation ¬.",
    [LatexCommand.Lnot]: "Logical negation ¬ (alias of \\neg).",
    [LatexCommand.Forall]: "Universal quantifier ∀.",
    [LatexCommand.Exists]: "Existential quantifier ∃.",
    [LatexCommand.Top]: "Top ⊤.",
    [LatexCommand.Bot]: "Bottom ⊥.",
    [LatexCommand.To]: "Right arrow →.",
    [LatexCommand.Gets]: "Left arrow ←.",
    [LatexCommand.Mapsto]: "Maps-to arrow ↦.",
    [LatexCommand.Leftarrow]: "Left arrow ←.",
    [LatexCommand.Rightarrow]: "Right arrow →.",
    [LatexCommand.Uparrow]: "Up arrow ↑.",
    [LatexCommand.Downarrow]: "Down arrow ↓.",
    [LatexCommand.Leftrightarrow]: "Left-right arrow ↔.",
    [LatexCommand.Longleftarrow]: "Long left arrow ⟵.",
    [LatexCommand.Longrightarrow]: "Long right arrow ⟶.",
    [LatexCommand.Hookrightarrow]: "Hooked right arrow ↪.",
    [LatexCommand.LeftarrowDouble]: "Leftward double arrow ⇐.",
    [LatexCommand.RightarrowDouble]: "Implication ⇒.",
    [LatexCommand.LeftrightarrowDouble]: "Bi-implication ⇔.",
    [LatexCommand.Implies]: "Implies ⟹.",
    [LatexCommand.Iff]: "If and only if ⟺.",
    [LatexCommand.Alpha]: "The Greek letter α.",
    [LatexCommand.Beta]: "The Greek letter β.",
    [LatexCommand.Gamma]: "The Greek letter γ.",
    [LatexCommand.Delta]: "The Greek letter δ.",
    [LatexCommand.Epsilon]: "The Greek letter ε.",
    [LatexCommand.Varepsilon]: "The Greek letter ε (variant).",
    [LatexCommand.Zeta]: "The Greek letter ζ.",
    [LatexCommand.Eta]: "The Greek letter η.",
    [LatexCommand.Theta]: "The Greek letter θ.",
    [LatexCommand.Vartheta]: "The Greek letter ϑ (variant theta).",
    [LatexCommand.Iota]: "The Greek letter ι.",
    [LatexCommand.Kappa]: "The Greek letter κ.",
    [LatexCommand.Lambda]: "The Greek letter λ.",
    [LatexCommand.Mu]: "The Greek letter μ.",
    [LatexCommand.Nu]: "The Greek letter ν.",
    [LatexCommand.Xi]: "The Greek letter ξ.",
    [LatexCommand.Pi]: "The Greek letter π.",
    [LatexCommand.Varpi]: "The Greek letter ϖ (variant pi).",
    [LatexCommand.Rho]: "The Greek letter ρ.",
    [LatexCommand.Varrho]: "The Greek letter ϱ (variant rho).",
    [LatexCommand.Sigma]: "The Greek letter σ.",
    [LatexCommand.Varsigma]: "The Greek letter ς (final sigma).",
    [LatexCommand.Tau]: "The Greek letter τ.",
    [LatexCommand.Upsilon]: "The Greek letter υ.",
    [LatexCommand.Phi]: "The Greek letter φ.",
    [LatexCommand.Varphi]: "The Greek letter ϕ (variant phi).",
    [LatexCommand.Chi]: "The Greek letter χ.",
    [LatexCommand.Psi]: "The Greek letter ψ.",
    [LatexCommand.Omega]: "The Greek letter ω.",
    [LatexCommand.UpperGamma]: "The Greek letter Γ.",
    [LatexCommand.UpperDelta]: "The Greek letter Δ.",
    [LatexCommand.UpperTheta]: "The Greek letter Θ.",
    [LatexCommand.UpperLambda]: "The Greek letter Λ.",
    [LatexCommand.UpperXi]: "The Greek letter Ξ.",
    [LatexCommand.UpperPi]: "The Greek letter Π.",
    [LatexCommand.UpperSigma]: "The Greek letter Σ.",
    [LatexCommand.UpperUpsilon]: "The Greek letter Υ.",
    [LatexCommand.UpperPhi]: "The Greek letter Φ.",
    [LatexCommand.UpperPsi]: "The Greek letter Ψ.",
    [LatexCommand.UpperOmega]: "The Greek letter Ω.",
    [LatexCommand.Partial]: "Partial derivative ∂.",
    [LatexCommand.Nabla]: "Nabla ∇.",
    [LatexCommand.Infty]: "Infinity ∞.",
    [LatexCommand.Hbar]: "Reduced Planck constant ℏ.",
    [LatexCommand.Ell]: "Script small l ℓ.",
    [LatexCommand.Re]: "Real part ℜ.",
    [LatexCommand.Im]: "Imaginary part ℑ.",
    [LatexCommand.Aleph]: "Aleph ℵ.",
    [LatexCommand.Angle]: "Angle ∠.",
    [LatexCommand.Prime]: "Prime ′.",
    [LatexCommand.Ldots]: "Low ellipsis ….",
    [LatexCommand.Cdots]: "Centred ellipsis ⋯.",
    [LatexCommand.Vdots]: "Vertical ellipsis ⋮.",
    [LatexCommand.Ddots]: "Diagonal ellipsis ⋱.",
    [LatexCommand.Sin]: "Sine `sin`.",
    [LatexCommand.Cos]: "Cosine `cos`.",
    [LatexCommand.Tan]: "Tangent `tan`.",
    [LatexCommand.Cot]: "Cotangent `cot`.",
    [LatexCommand.Sec]: "Secant `sec`.",
    [LatexCommand.Csc]: "Cosecant `csc`.",
    [LatexCommand.Arcsin]: "Inverse sine `arcsin`.",
    [LatexCommand.Arccos]: "Inverse cosine `arccos`.",
    [LatexCommand.Arctan]: "Inverse tangent `arctan`.",
    [LatexCommand.Sinh]: "Hyperbolic sine `sinh`.",
    [LatexCommand.Cosh]: "Hyperbolic cosine `cosh`.",
    [LatexCommand.Tanh]: "Hyperbolic tangent `tanh`.",
    [LatexCommand.Log]: "Logarithm `log`.",
    [LatexCommand.Ln]: "Natural logarithm `ln`.",
    [LatexCommand.Exp]: "Exponential `exp`.",
    [LatexCommand.Lim]: "Limit `lim`.",
    [LatexCommand.Limsup]: "Limit superior `lim sup`.",
    [LatexCommand.Liminf]: "Limit inferior `lim inf`.",
    [LatexCommand.Max]: "Maximum `max`.",
    [LatexCommand.Min]: "Minimum `min`.",
    [LatexCommand.Sup]: "Supremum `sup`.",
    [LatexCommand.Inf]: "Infimum `inf`.",
    [LatexCommand.Gcd]: "Greatest common divisor `gcd`.",
    [LatexCommand.Deg]: "Degree `deg`.",
    [LatexCommand.Det]: "Determinant `det`.",
    [LatexCommand.Dim]: "Dimension `dim`.",
    [LatexCommand.Ker]: "Kernel `ker`.",
    [LatexCommand.Arg]: "Argument `arg`.",
    [LatexCommand.Sum]: "Summation ∑ with limits.",
    [LatexCommand.Prod]: "Product ∏ with limits.",
    [LatexCommand.Coprod]: "Coproduct ∐ with limits.",
    [LatexCommand.Bigcup]: "Big union ⋃ with limits.",
    [LatexCommand.Bigcap]: "Big intersection ⋂ with limits.",
    [LatexCommand.Bigvee]: "Big disjunction ⋁ with limits.",
    [LatexCommand.Bigwedge]: "Big conjunction ⋀ with limits.",
    [LatexCommand.Bigoplus]: "Big direct sum ⨁ with limits.",
    [LatexCommand.Bigotimes]: "Big tensor product ⨂ with limits.",
    [LatexCommand.Bigsqcup]: "Big square union ⨆ with limits.",
    [LatexCommand.Int]: "Integral ∫ with limits.",
    [LatexCommand.Oint]: "Contour integral ∮ with limits.",
    [LatexCommand.Iint]: "Double integral ∬ with limits.",
    [LatexCommand.Iiint]: "Triple integral ∭ with limits."
} as const satisfies Record<LatexCommand, string>;

// Big operators take under/over limits, so they insert with a limit snippet; every other command inserts bare.
// `satisfies ReadonlyArray<BigOperatorCommand>` rejects any command the shared IR does not classify as a big operator.
const LATEX_LIMIT_SNIPPET = "_{${1:i=1}}^{${2:n}} $0";
const LATEX_LIMIT_COMMANDS = [
    LatexCommand.Sum,
    LatexCommand.Prod,
    LatexCommand.Coprod,
    LatexCommand.Bigcup,
    LatexCommand.Bigcap,
    LatexCommand.Bigvee,
    LatexCommand.Bigwedge,
    LatexCommand.Bigoplus,
    LatexCommand.Bigotimes,
    LatexCommand.Bigsqcup,
    LatexCommand.Int,
    LatexCommand.Oint,
    LatexCommand.Iint,
    LatexCommand.Iiint
] as const satisfies ReadonlyArray<BigOperatorCommand>;
const isLatexLimitCommand = memberGuard(LATEX_LIMIT_COMMANDS);

// Accents wrap their single argument (`\hat{x}`); `satisfies Record<LatexAccentCommand, ...>` keeps them covered.
const LATEX_ACCENT_INFO = {
    [LatexAccentCommand.Hat]: "Hat accent, drawn over the argument (x̂).",
    [LatexAccentCommand.Vec]: "Vector arrow accent (x⃗).",
    [LatexAccentCommand.Bar]: "Bar accent (x̄).",
    [LatexAccentCommand.Tilde]: "Tilde accent (x̃).",
    [LatexAccentCommand.Dot]: "Dot accent (ẋ).",
    [LatexAccentCommand.Ddot]: "Double-dot accent (ẍ).",
    [LatexAccentCommand.Overline]: "Overline, drawn across the argument."
} as const satisfies Record<LatexAccentCommand, string>;

// `\frac` and `\sqrt` take braced arguments, so they are curated with their own snippets rather than the table.
const LATEX_STRUCTURAL: ReadonlyArray<CompletionItem> = [
    latexCommand("\\frac", "\\frac{${1:a}}{${2:b}}$0", "A fraction, a over b."),
    latexCommand("\\sqrt", "\\sqrt{${1:x}}$0", "A square root; `\\sqrt[n]{x}` for an nth root.")
];

// Font-variant commands restyle their braced argument; each maps to the same `MathVariant` as its math directive.
const LATEX_VARIANT_INFO = {
    [VariantCommand.Mathrm]: "Upright roman shape.",
    [VariantCommand.Mathbf]: "Bold weight.",
    [VariantCommand.Mathit]: "Italic shape.",
    [VariantCommand.Boldsymbol]: "Bold italic.",
    [VariantCommand.Mathbb]: "Blackboard bold, for number sets (ℝ).",
    [VariantCommand.Mathcal]: "Calligraphic script (𝓛).",
    [VariantCommand.Mathfrak]: "Fraktur (𝔤).",
    [VariantCommand.Mathsf]: "Sans-serif.",
    [VariantCommand.Mathtt]: "Monospace."
} as const satisfies Record<VariantCommand, string>;

const LATEX_COLOR_INFO = {
    [ColorCommand.TextColor]: "Color the second group the color named by the first (`\\textcolor{red}{x}`)."
} as const satisfies Record<ColorCommand, string>;

// `\limits`/`\nolimits` follow a big operator to force its bounds stacked or beside, overriding the glyph default.
const LATEX_LIMITS_INFO = {
    [LimitsCommand.Limits]: "Force the preceding big operator's limits to stack above and below it.",
    [LimitsCommand.Nolimits]: "Force the preceding big operator's limits beside the sign."
} as const satisfies Record<LimitsCommand, string>;

function latexCommands(): ReadonlyArray<CompletionItem> {
    const out: Array<CompletionItem> = [];
    for (const item of LATEX_STRUCTURAL) out.push(item);
    for (const [command, doc] of Object.entries(LATEX_COMMAND_INFO)) out.push(latexCommand(command, isLatexLimitCommand(command) ? `${command}${LATEX_LIMIT_SNIPPET}` : command, doc));

    for (const [command, doc] of Object.entries(LATEX_ACCENT_INFO)) out.push(latexCommand(`\\${command}`, `\\${command}{\${1:x}} $0`, doc));
    for (const [command, doc] of Object.entries(LATEX_VARIANT_INFO)) out.push(latexCommand(command, `${command}{\${1:x}}$0`, doc));
    out.push(latexCommand(ColorCommand.TextColor, `${ColorCommand.TextColor}{\${1:red}}{\${2:x}}$0`, LATEX_COLOR_INFO[ColorCommand.TextColor]));
    for (const [command, doc] of Object.entries(LATEX_LIMITS_INFO)) out.push(latexCommand(command, command, doc));
    return out;
}

export const LATEX_COMMANDS: ReadonlyArray<CompletionItem> = latexCommands();

// The color-directive argument (`color(<here>, x)`, `\textcolor{<here>}{x}`) draws from the portable palette, so
// the editor suggests exactly the names that render in both HTML and PowerPoint, each shown with its swatch.
function colorItem(name: string, hex: string): CompletionItem {
    const value = `#${hex}`;
    return {
        label: name,
        insert: name,
        detail: value,
        doc: `The color \`${name}\` (${value}).`,
        kind: CompletionKind.Color,
        color: value
    };
}

export const COLORS: ReadonlyArray<CompletionItem> = Object.entries(COLOR_HEX).map(([name, hex]) => colorItem(name, hex));

function colorKey(label: string, doc: string): CompletionItem {
    return { label, insert: `${label}: \${0:#5cd0b3}`, detail: "color", doc, kind: CompletionKind.Frontmatter };
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
    colorKey("accent", "Primary accent color -- headings, links, the particle hue."),
    colorKey("accent2", "Secondary accent color."),
    colorKey("accent3", "Tertiary accent color (alias of `highlight`)."),
    colorKey("highlight", "Highlight color, used as the tertiary accent."),
    colorKey("bg", "Slide background color."),
    colorKey("text", "Primary text color."),
    colorKey("textSecondary", "Secondary text color."),
    colorKey("muted", "Muted text color."),
    colorKey("surface", "Card/surface fill color."),
    colorKey("border", "Surface border color."),
    colorKey("track", "Bar/progress track color."),
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

// Keys whose value is a fixed set; the editor offers these once the caret is past the `key:`. Color keys are
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
