import { declaration } from "@dropdeck/html/css";
import { parseHex } from "#/hex";
import { isDarkConfig } from "#/config";
import type { DeckConfig } from "#/config";
import type { Declaration } from "@dropdeck/html/css";

export type Theme = {
    particlesOn: boolean,
    particleRgb: string
};

type ThemeValues = {
    vars: Array<readonly [string, string]>,
    fonts: Array<string>,
    bg: string,
    dark: boolean,
    theme: Theme
};

export function hexToRgb(hex: string | undefined): string | null {
    const rgb = parseHex((hex ?? "").trim());
    return rgb === null ? null : rgb.join(",");
}

function loadFont(name: string | undefined): void {
    if (!name) return;
    const id = `gf-${name.replace(/\W/g, "")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    const family = encodeURIComponent(name).replace(/%20/g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${family}:ital,wght@0,400;0,500;0,700;0,800;1,400&display=swap`;
    document.head.appendChild(link);
}

function themeValues(config: DeckConfig): ThemeValues {
    const dark = isDarkConfig(config);
    const vars: Array<readonly [string, string]> = [];
    function set(key: string, value: string | null | undefined): void {
        if (value) vars.push([key, value]);
    }

    const bg = config.bg ?? (dark ? "#0b1220" : "#f8fafc");
    const accent1 = config.accent ?? (dark ? "#5cd0b3" : "#0f766e");
    const accent2 = config.accent2 ?? (dark ? "#58c4dd" : "#14b8a6");
    const accent3 = config.highlight ?? config.accent3 ?? "#f59e0b";

    set("--color-bg", bg);
    set("--color-text", config.text ?? (dark ? "#e6edf3" : "#0f172a"));
    set("--color-text-secondary", config.textSecondary ?? (dark ? "#aab6c4" : "#334155"));
    set("--color-text-muted", config.muted ?? (dark ? "#7e8ca0" : "#64748b"));
    set("--color-accent-1", accent1);
    set("--color-accent-2", accent2);
    set("--color-accent-3", accent3);
    set("--accent1-rgb", hexToRgb(accent1));
    set("--accent2-rgb", hexToRgb(accent2));
    set("--accent3-rgb", hexToRgb(accent3));
    set("--surface", config.surface ?? (dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.92)"));
    set("--surface-border", config.border ?? (dark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.08)"));
    set("--track", config.track ?? (dark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)"));

    const body = config.font ?? config.sans;
    const display = config.titleFont ?? config.serif;
    const { mono } = config;
    if (body) set("--font-body", `'${body}', Manrope, system-ui, sans-serif`);
    if (display) set("--font-display", `'${display}', Georgia, serif`);
    if (mono) set("--font-mono", `'${mono}', 'Fira Code', ui-monospace, monospace`);
    const fonts: Array<string> = [];
    for (const font of [body, display, mono]) if (font) fonts.push(font);

    return { vars, fonts, bg, dark, theme: { particlesOn: config.particles !== "false", particleRgb: hexToRgb(accent1) ?? "15,118,110" } };
}

// `data-theme` selects the palette in `rootStyle`; the resolved variables (with any frontmatter overrides) are then
// set inline over it, and `color-scheme` follows via the same attribute.
function applyValues(target: HTMLElement, values: ThemeValues): void {
    if (values.dark) target.dataset.theme = "dark";
    else delete target.dataset.theme;
    for (const [key, value] of values.vars) target.style.setProperty(key, value);
    for (const font of values.fonts) loadFont(font);
}

export function applyConfig(config: DeckConfig): Theme {
    const values = themeValues(config);
    applyValues(document.documentElement, values);
    document.body.style.background = values.bg;
    return values.theme;
}

export function applyTheme(target: HTMLElement, config: DeckConfig): Theme {
    const values = themeValues(config);
    applyValues(target, values);
    target.style.background = values.bg;
    return values.theme;
}

// A slide inherits every deck key it does not set, so only the differing variables are emitted -- an unchanged
// slide yields none, hence no style attribute. The background is emitted directly because the page background
// paints `html, body`, which a variable scoped to one slide cannot reach; the slide's particles and mesh are
// children, so they still render over it.
export function slideStyle(deckConfig: DeckConfig, frontmatter: DeckConfig): ReadonlyArray<Declaration> {
    const base = themeValues(deckConfig);
    const slide = themeValues(Object.assign({}, deckConfig, frontmatter));
    const baseVars = new Map<string, string>(base.vars);
    const declarations: Array<Declaration> = [];
    for (const [name, value] of slide.vars) {
        if (baseVars.get(name) !== value)
            declarations.push(declaration(name, value));
    }
    if (slide.bg !== base.bg) declarations.push(declaration("background", slide.bg));
    return declarations;
}
