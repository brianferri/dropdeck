import { declaration, importRule, rule } from "@dropdeck/html/css";

export const rootStyle = [
    importRule("https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"),
    rule([":root"], [
        declaration("color-scheme", "light"),
        declaration("--color-bg", "#f8fafc"),
        declaration("--color-text", "#0f172a"),
        declaration("--color-text-secondary", "#334155"),
        declaration("--color-text-muted", "#64748b"),
        declaration("--color-accent-1", "#0f766e"),
        declaration("--color-accent-2", "#14b8a6"),
        declaration("--color-accent-3", "#f59e0b"),
        declaration("--accent1-rgb", "15, 118, 110"),
        declaration("--accent2-rgb", "20, 184, 166"),
        declaration("--accent3-rgb", "245, 158, 11"),
        declaration("--surface", "rgba(255, 255, 255, 0.92)"),
        declaration("--surface-border", "rgba(15, 23, 42, 0.08)"),
        declaration("--track", "rgba(15, 23, 42, 0.08)"),
        declaration("--font-body", "'Manrope', Arial, sans-serif"),
        declaration("--font-display", "'DM Serif Display', Georgia, serif"),
        declaration("--font-mono", "'Fira Code', ui-monospace, monospace")
    ]),
    rule(["[data-theme=\"dark\"]"], [
        declaration("color-scheme", "dark"),
        declaration("--color-bg", "#0b1220"),
        declaration("--color-text", "#e6edf3"),
        declaration("--color-text-secondary", "#aab6c4"),
        declaration("--color-text-muted", "#7e8ca0"),
        declaration("--color-accent-1", "#5cd0b3"),
        declaration("--color-accent-2", "#58c4dd"),
        declaration("--color-accent-3", "#f59e0b"),
        declaration("--accent1-rgb", "92, 208, 179"),
        declaration("--accent2-rgb", "88, 196, 221"),
        declaration("--accent3-rgb", "245, 158, 11"),
        declaration("--surface", "rgba(255, 255, 255, 0.06)"),
        declaration("--surface-border", "rgba(255, 255, 255, 0.14)"),
        declaration("--track", "rgba(255, 255, 255, 0.12)")
    ])
] as const;
