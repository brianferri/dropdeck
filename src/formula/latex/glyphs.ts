import { memberGuard } from "@dropdeck/common";

// The command spelling (with its backslash) is the enum value, so the parser's symbols and this table share one
// vocabulary; `LATEX_GLYPH` is keyed by these members and `satisfies` proves every command carries a glyph.
export enum LatexCommand {
    Le = "\\le",
    Leq = "\\leq",
    Ge = "\\ge",
    Geq = "\\geq",
    Ne = "\\ne",
    Neq = "\\neq",
    Ll = "\\ll",
    Gg = "\\gg",
    Prec = "\\prec",
    Succ = "\\succ",
    Preceq = "\\preceq",
    Succeq = "\\succeq",
    Approx = "\\approx",
    Equiv = "\\equiv",
    Cong = "\\cong",
    Simeq = "\\simeq",
    Sim = "\\sim",
    Asymp = "\\asymp",
    Propto = "\\propto",
    Parallel = "\\parallel",
    Mid = "\\mid",
    Perp = "\\perp",
    In = "\\in",
    Notin = "\\notin",
    Ni = "\\ni",
    Cup = "\\cup",
    Cap = "\\cap",
    Subset = "\\subset",
    Subseteq = "\\subseteq",
    Supset = "\\supset",
    Supseteq = "\\supseteq",
    Setminus = "\\setminus",
    Emptyset = "\\emptyset",
    Cdot = "\\cdot",
    Times = "\\times",
    Div = "\\div",
    Pm = "\\pm",
    Mp = "\\mp",
    Ast = "\\ast",
    Star = "\\star",
    Circ = "\\circ",
    Bullet = "\\bullet",
    Diamond = "\\diamond",
    Oplus = "\\oplus",
    Ominus = "\\ominus",
    Otimes = "\\otimes",
    Oslash = "\\oslash",
    Odot = "\\odot",
    Dagger = "\\dagger",
    Ddagger = "\\ddagger",
    Sqcup = "\\sqcup",
    Sqcap = "\\sqcap",
    Uplus = "\\uplus",
    Land = "\\land",
    Lor = "\\lor",
    Wedge = "\\wedge",
    Vee = "\\vee",
    Neg = "\\neg",
    Lnot = "\\lnot",
    Forall = "\\forall",
    Exists = "\\exists",
    Top = "\\top",
    Bot = "\\bot",
    To = "\\to",
    Gets = "\\gets",
    Mapsto = "\\mapsto",
    Leftarrow = "\\leftarrow",
    Rightarrow = "\\rightarrow",
    Uparrow = "\\uparrow",
    Downarrow = "\\downarrow",
    Leftrightarrow = "\\leftrightarrow",
    Longleftarrow = "\\longleftarrow",
    Longrightarrow = "\\longrightarrow",
    Hookrightarrow = "\\hookrightarrow",
    LeftarrowDouble = "\\Leftarrow",
    RightarrowDouble = "\\Rightarrow",
    LeftrightarrowDouble = "\\Leftrightarrow",
    Implies = "\\implies",
    Iff = "\\iff",
    Alpha = "\\alpha",
    Beta = "\\beta",
    Gamma = "\\gamma",
    Delta = "\\delta",
    Epsilon = "\\epsilon",
    Varepsilon = "\\varepsilon",
    Zeta = "\\zeta",
    Eta = "\\eta",
    Theta = "\\theta",
    Vartheta = "\\vartheta",
    Iota = "\\iota",
    Kappa = "\\kappa",
    Lambda = "\\lambda",
    Mu = "\\mu",
    Nu = "\\nu",
    Xi = "\\xi",
    Pi = "\\pi",
    Varpi = "\\varpi",
    Rho = "\\rho",
    Varrho = "\\varrho",
    Sigma = "\\sigma",
    Varsigma = "\\varsigma",
    Tau = "\\tau",
    Upsilon = "\\upsilon",
    Phi = "\\phi",
    Varphi = "\\varphi",
    Chi = "\\chi",
    Psi = "\\psi",
    Omega = "\\omega",
    UpperGamma = "\\Gamma",
    UpperDelta = "\\Delta",
    UpperTheta = "\\Theta",
    UpperLambda = "\\Lambda",
    UpperXi = "\\Xi",
    UpperPi = "\\Pi",
    UpperSigma = "\\Sigma",
    UpperUpsilon = "\\Upsilon",
    UpperPhi = "\\Phi",
    UpperPsi = "\\Psi",
    UpperOmega = "\\Omega",
    Partial = "\\partial",
    Nabla = "\\nabla",
    Infty = "\\infty",
    Hbar = "\\hbar",
    Ell = "\\ell",
    Re = "\\Re",
    Im = "\\Im",
    Aleph = "\\aleph",
    Angle = "\\angle",
    Prime = "\\prime",
    Ldots = "\\ldots",
    Cdots = "\\cdots",
    Vdots = "\\vdots",
    Ddots = "\\ddots",
    Sin = "\\sin",
    Cos = "\\cos",
    Tan = "\\tan",
    Cot = "\\cot",
    Sec = "\\sec",
    Csc = "\\csc",
    Arcsin = "\\arcsin",
    Arccos = "\\arccos",
    Arctan = "\\arctan",
    Sinh = "\\sinh",
    Cosh = "\\cosh",
    Tanh = "\\tanh",
    Log = "\\log",
    Ln = "\\ln",
    Exp = "\\exp",
    Lim = "\\lim",
    Limsup = "\\limsup",
    Liminf = "\\liminf",
    Max = "\\max",
    Min = "\\min",
    Sup = "\\sup",
    Inf = "\\inf",
    Gcd = "\\gcd",
    Deg = "\\deg",
    Det = "\\det",
    Dim = "\\dim",
    Ker = "\\ker",
    Arg = "\\arg",
    Sum = "\\sum",
    Prod = "\\prod",
    Coprod = "\\coprod",
    Bigcup = "\\bigcup",
    Bigcap = "\\bigcap",
    Bigvee = "\\bigvee",
    Bigwedge = "\\bigwedge",
    Bigoplus = "\\bigoplus",
    Bigotimes = "\\bigotimes",
    Bigsqcup = "\\bigsqcup",
    Int = "\\int",
    Oint = "\\oint",
    Iint = "\\iint",
    Iiint = "\\iiint"
}

const LATEX_GLYPH = {
    [LatexCommand.Le]: "≤",
    [LatexCommand.Leq]: "≤",
    [LatexCommand.Ge]: "≥",
    [LatexCommand.Geq]: "≥",
    [LatexCommand.Ne]: "≠",
    [LatexCommand.Neq]: "≠",
    [LatexCommand.Ll]: "≪",
    [LatexCommand.Gg]: "≫",
    [LatexCommand.Prec]: "≺",
    [LatexCommand.Succ]: "≻",
    [LatexCommand.Preceq]: "⪯",
    [LatexCommand.Succeq]: "⪰",
    [LatexCommand.Approx]: "≈",
    [LatexCommand.Equiv]: "≡",
    [LatexCommand.Cong]: "≅",
    [LatexCommand.Simeq]: "≃",
    [LatexCommand.Sim]: "∼",
    [LatexCommand.Asymp]: "≍",
    [LatexCommand.Propto]: "∝",
    [LatexCommand.Parallel]: "∥",
    [LatexCommand.Mid]: "∣",
    [LatexCommand.Perp]: "⊥",
    [LatexCommand.In]: "∈",
    [LatexCommand.Notin]: "∉",
    [LatexCommand.Ni]: "∋",
    [LatexCommand.Cup]: "∪",
    [LatexCommand.Cap]: "∩",
    [LatexCommand.Subset]: "⊂",
    [LatexCommand.Subseteq]: "⊆",
    [LatexCommand.Supset]: "⊃",
    [LatexCommand.Supseteq]: "⊇",
    [LatexCommand.Setminus]: "∖",
    [LatexCommand.Emptyset]: "∅",
    [LatexCommand.Cdot]: "·",
    [LatexCommand.Times]: "×",
    [LatexCommand.Div]: "÷",
    [LatexCommand.Pm]: "±",
    [LatexCommand.Mp]: "∓",
    [LatexCommand.Ast]: "∗",
    [LatexCommand.Star]: "⋆",
    [LatexCommand.Circ]: "∘",
    [LatexCommand.Bullet]: "∙",
    [LatexCommand.Diamond]: "⋄",
    [LatexCommand.Oplus]: "⊕",
    [LatexCommand.Ominus]: "⊖",
    [LatexCommand.Otimes]: "⊗",
    [LatexCommand.Oslash]: "⊘",
    [LatexCommand.Odot]: "⊙",
    [LatexCommand.Dagger]: "†",
    [LatexCommand.Ddagger]: "‡",
    [LatexCommand.Sqcup]: "⊔",
    [LatexCommand.Sqcap]: "⊓",
    [LatexCommand.Uplus]: "⊎",
    [LatexCommand.Land]: "∧",
    [LatexCommand.Lor]: "∨",
    [LatexCommand.Wedge]: "∧",
    [LatexCommand.Vee]: "∨",
    [LatexCommand.Neg]: "¬",
    [LatexCommand.Lnot]: "¬",
    [LatexCommand.Forall]: "∀",
    [LatexCommand.Exists]: "∃",
    [LatexCommand.Top]: "⊤",
    [LatexCommand.Bot]: "⊥",
    [LatexCommand.To]: "→",
    [LatexCommand.Gets]: "←",
    [LatexCommand.Mapsto]: "↦",
    [LatexCommand.Leftarrow]: "←",
    [LatexCommand.Rightarrow]: "→",
    [LatexCommand.Uparrow]: "↑",
    [LatexCommand.Downarrow]: "↓",
    [LatexCommand.Leftrightarrow]: "↔",
    [LatexCommand.Longleftarrow]: "⟵",
    [LatexCommand.Longrightarrow]: "⟶",
    [LatexCommand.Hookrightarrow]: "↪",
    [LatexCommand.LeftarrowDouble]: "⇐",
    [LatexCommand.RightarrowDouble]: "⇒",
    [LatexCommand.LeftrightarrowDouble]: "⇔",
    [LatexCommand.Implies]: "⟹",
    [LatexCommand.Iff]: "⟺",
    [LatexCommand.Alpha]: "α",
    [LatexCommand.Beta]: "β",
    [LatexCommand.Gamma]: "γ",
    [LatexCommand.Delta]: "δ",
    [LatexCommand.Epsilon]: "ε",
    [LatexCommand.Varepsilon]: "ε",
    [LatexCommand.Zeta]: "ζ",
    [LatexCommand.Eta]: "η",
    [LatexCommand.Theta]: "θ",
    [LatexCommand.Vartheta]: "ϑ",
    [LatexCommand.Iota]: "ι",
    [LatexCommand.Kappa]: "κ",
    [LatexCommand.Lambda]: "λ",
    [LatexCommand.Mu]: "μ",
    [LatexCommand.Nu]: "ν",
    [LatexCommand.Xi]: "ξ",
    [LatexCommand.Pi]: "π",
    [LatexCommand.Varpi]: "ϖ",
    [LatexCommand.Rho]: "ρ",
    [LatexCommand.Varrho]: "ϱ",
    [LatexCommand.Sigma]: "σ",
    [LatexCommand.Varsigma]: "ς",
    [LatexCommand.Tau]: "τ",
    [LatexCommand.Upsilon]: "υ",
    [LatexCommand.Phi]: "φ",
    [LatexCommand.Varphi]: "ϕ",
    [LatexCommand.Chi]: "χ",
    [LatexCommand.Psi]: "ψ",
    [LatexCommand.Omega]: "ω",
    [LatexCommand.UpperGamma]: "Γ",
    [LatexCommand.UpperDelta]: "Δ",
    [LatexCommand.UpperTheta]: "Θ",
    [LatexCommand.UpperLambda]: "Λ",
    [LatexCommand.UpperXi]: "Ξ",
    [LatexCommand.UpperPi]: "Π",
    [LatexCommand.UpperSigma]: "Σ",
    [LatexCommand.UpperUpsilon]: "Υ",
    [LatexCommand.UpperPhi]: "Φ",
    [LatexCommand.UpperPsi]: "Ψ",
    [LatexCommand.UpperOmega]: "Ω",
    [LatexCommand.Partial]: "∂",
    [LatexCommand.Nabla]: "∇",
    [LatexCommand.Infty]: "∞",
    [LatexCommand.Hbar]: "ℏ",
    [LatexCommand.Ell]: "ℓ",
    [LatexCommand.Re]: "ℜ",
    [LatexCommand.Im]: "ℑ",
    [LatexCommand.Aleph]: "ℵ",
    [LatexCommand.Angle]: "∠",
    [LatexCommand.Prime]: "′",
    [LatexCommand.Ldots]: "…",
    [LatexCommand.Cdots]: "⋯",
    [LatexCommand.Vdots]: "⋮",
    [LatexCommand.Ddots]: "⋱",
    [LatexCommand.Sin]: "sin",
    [LatexCommand.Cos]: "cos",
    [LatexCommand.Tan]: "tan",
    [LatexCommand.Cot]: "cot",
    [LatexCommand.Sec]: "sec",
    [LatexCommand.Csc]: "csc",
    [LatexCommand.Arcsin]: "arcsin",
    [LatexCommand.Arccos]: "arccos",
    [LatexCommand.Arctan]: "arctan",
    [LatexCommand.Sinh]: "sinh",
    [LatexCommand.Cosh]: "cosh",
    [LatexCommand.Tanh]: "tanh",
    [LatexCommand.Log]: "log",
    [LatexCommand.Ln]: "ln",
    [LatexCommand.Exp]: "exp",
    [LatexCommand.Lim]: "lim",
    [LatexCommand.Limsup]: "lim sup",
    [LatexCommand.Liminf]: "lim inf",
    [LatexCommand.Max]: "max",
    [LatexCommand.Min]: "min",
    [LatexCommand.Sup]: "sup",
    [LatexCommand.Inf]: "inf",
    [LatexCommand.Gcd]: "gcd",
    [LatexCommand.Deg]: "deg",
    [LatexCommand.Det]: "det",
    [LatexCommand.Dim]: "dim",
    [LatexCommand.Ker]: "ker",
    [LatexCommand.Arg]: "arg",
    [LatexCommand.Sum]: "∑",
    [LatexCommand.Prod]: "∏",
    [LatexCommand.Coprod]: "∐",
    [LatexCommand.Bigcup]: "⋃",
    [LatexCommand.Bigcap]: "⋂",
    [LatexCommand.Bigvee]: "⋁",
    [LatexCommand.Bigwedge]: "⋀",
    [LatexCommand.Bigoplus]: "⨁",
    [LatexCommand.Bigotimes]: "⨂",
    [LatexCommand.Bigsqcup]: "⨆",
    [LatexCommand.Int]: "∫",
    [LatexCommand.Oint]: "∮",
    [LatexCommand.Iint]: "∬",
    [LatexCommand.Iiint]: "∭"
} as const satisfies Record<LatexCommand, string>;

type LatexGlyphTable = { [Command in keyof typeof LATEX_GLYPH as `${Command}`]: (typeof LATEX_GLYPH)[Command] };

type UnknownCommand<Symbol extends string> = `unknown LaTeX command '${Symbol}'`;

// A covered command yields its glyph; an uncovered `\command` diagnoses by name; a bare identifier passes through.
export type LatexGlyph<Symbol extends string> =
    Symbol extends keyof LatexGlyphTable ? LatexGlyphTable[Symbol]
        : Symbol extends `\\${string}` ? UnknownCommand<Symbol>
            : Symbol;

// Every glyph this frontend can emit; the shared IR narrows its nary glyphs out of this so they trace to the table.
export type Glyphs = typeof LATEX_GLYPH[keyof typeof LATEX_GLYPH];

// The nary classification is declared as enum members -- `Extract<LatexCommand, ...>` rejects a non-member -- and
// the glyphs flip out of the table via `${Command}`, so no glyph string is ever spelled out by hand.
export type NaryCommand = Extract<
    LatexCommand,
    | LatexCommand.Sum
    | LatexCommand.Prod
    | LatexCommand.Coprod
    | LatexCommand.Bigcup
    | LatexCommand.Bigcap
    | LatexCommand.Bigvee
    | LatexCommand.Bigwedge
    | LatexCommand.Bigoplus
    | LatexCommand.Bigotimes
    | LatexCommand.Bigsqcup
    | LatexCommand.Int
    | LatexCommand.Oint
    | LatexCommand.Iint
    | LatexCommand.Iiint
>;
export type NaryIntegralCommand = Extract<
    LatexCommand,
    | LatexCommand.Int
    | LatexCommand.Oint
    | LatexCommand.Iint
    | LatexCommand.Iiint
>;

export type LimWordCommand = Extract<
    LatexCommand,
    | LatexCommand.Lim
    | LatexCommand.Limsup
    | LatexCommand.Liminf
    | LatexCommand.Max
    | LatexCommand.Min
    | LatexCommand.Sup
    | LatexCommand.Inf
>;

export type NaryGlyph = LatexGlyphTable[`${NaryCommand}`];
export type NaryIntegralGlyph = LatexGlyphTable[`${NaryIntegralCommand}`];
export type NaryStackedGlyph = Exclude<NaryGlyph, NaryIntegralGlyph>;
export type LimWord = LatexGlyphTable[`${LimWordCommand}`];

const isLatexCommand = memberGuard<LatexCommand>(Object.values(LatexCommand));

// The parser marks a command with a leading backslash a plain letter never carries.
function isCommand<S extends string>(symbol: S): symbol is S & `\\${string}` {
    return symbol.startsWith("\\");
}

/**
 * A bare identifier passes through; a command narrows to `LatexCommand`, a total key into the glyph table by the
 * `satisfies` proof, so only an unrecognised command remains, and that is an error.
 *
 * @throws {Error} when `symbol` is a `\command` this table does not cover.
 */
export function latexGlyph(symbol: string): string {
    if (!isCommand(symbol)) return symbol;
    if (isLatexCommand(symbol)) return LATEX_GLYPH[symbol];
    throw new Error(`unknown LaTeX command '${symbol}'`);
}

// A few glyphs carry an alias command (`≤` is both `\le` and `\leq`), so the reverse of the glyph table is a union
// there. Excluding the alias spellings leaves one canonical command per glyph, single-valued for the type level.
const LATEX_ALIASES = ["\\leq", "\\geq", "\\neq", "\\wedge", "\\vee", "\\lnot", "\\bot", "\\gets", "\\rightarrow", "\\varepsilon"] as const;
const ALIAS_COMMANDS = new Set<string>(LATEX_ALIASES);

type CommandByGlyph = { [Command in keyof LatexGlyphTable as LatexGlyphTable[Command]]: Command };
export type LatexCommandOf<Glyph extends string> =
    Glyph extends keyof CommandByGlyph ? Exclude<CommandByGlyph[Glyph], typeof LATEX_ALIASES[number]> : Glyph;

const COMMAND_BY_GLYPH = new Map<string, string>();
for (const [command, glyph] of Object.entries(LATEX_GLYPH)) if (!ALIAS_COMMANDS.has(command) && !COMMAND_BY_GLYPH.has(glyph)) COMMAND_BY_GLYPH.set(glyph, command);

// A glyph off the table (a bare letter, a raw `+`) has no command and serialises as itself.
export function latexSymbol(glyph: string): string {
    return COMMAND_BY_GLYPH.get(glyph) ?? glyph;
}
