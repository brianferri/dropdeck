// CSS surfaces are translucent (rgba over the page); OOXML fills are opaque, so those are flattened against the
// background here.

import type { DeckConfig } from "#/config";

type Rgb = readonly [number, number, number];

function parseHex(value: string, fallback: Rgb): Rgb {
    const match = (/^#?([0-9a-f]{6})$/i).exec(value.trim());
    if (!match) return fallback;
    const packed = parseInt(match[1], 16);
    return [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255];
}

function toHex(rgb: Rgb): string {
    return rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function flatten(over: Rgb, alpha: number, base: Rgb): string {
    function mix(channel: number): number {
        return (over[channel] * alpha) + (base[channel] * (1 - alpha));
    }
    return toHex([mix(0), mix(1), mix(2)]);
}

function pick(value: string | undefined, dark: string, light: string, isDark: boolean): string {
    return value ?? (isDark ? dark : light);
}

const WHITE: Rgb = [255, 255, 255];
const SLATE: Rgb = [15, 23, 42];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- inferred from the returned object so `Palette` cannot drift
export function resolvePalette(config: DeckConfig) {
    const dark = config.dark === "true" || config.theme === "dark" || config.colorSchema === "dark";
    const bgHex = pick(config.bg, "#0b1220", "#f8fafc", dark);
    const bg = parseHex(bgHex, dark ? [11, 18, 32] : [248, 250, 252]);
    const accent1 = parseHex(pick(config.accent, "#5cd0b3", "#0f766e", dark), WHITE);
    // The named accents index this list, and charts cycle series through it, so accent order lives in one place.
    const accents = [
        toHex(accent1),
        toHex(parseHex(pick(config.accent2, "#58c4dd", "#14b8a6", dark), WHITE)),
        toHex(parseHex(config.highlight ?? config.accent3 ?? "#f59e0b", WHITE))
    ];
    return {
        dark,
        bg: toHex(bg),
        text: toHex(parseHex(pick(config.text, "#e6edf3", "#0f172a", dark), WHITE)),
        secondary: toHex(parseHex(pick(config.textSecondary, "#aab6c4", "#334155", dark), SLATE)),
        muted: toHex(parseHex(pick(config.muted, "#7e8ca0", "#64748b", dark), SLATE)),
        accents,
        accent1: accents[0],
        accent2: accents[1],
        accent3: accents[2],
        surface: dark ? flatten(WHITE, 0.06, bg) : flatten(WHITE, 0.92, bg),
        track: dark ? flatten(WHITE, 0.12, bg) : flatten(SLATE, 0.08, bg),
        glassColor: "FFFFFF",
        glassOpacity: dark ? 10 : 88,
        borderColor: dark ? "FFFFFF" : "0F172A",
        borderOpacity: dark ? 16 : 9,
        chipColor: flatten(accent1, dark ? 0.22 : 0.14, bg),
        body: config.font ?? config.sans ?? "Manrope",
        display: config.titleFont ?? config.serif ?? "DM Serif Display",
        mono: config.mono ?? "Fira Code"
    };
}

export type Palette = ReturnType<typeof resolvePalette>;
