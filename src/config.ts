export enum LayoutHint {
    Center = "center",
    Default = "default"
}

export type DeckConfig = {
    accent?: string,
    accent2?: string,
    accent3?: string,
    highlight?: string,
    bg?: string,
    text?: string,
    textSecondary?: string,
    muted?: string,
    surface?: string,
    border?: string,
    track?: string,
    dark?: string,
    theme?: string,
    colorSchema?: string,
    font?: string,
    sans?: string,
    serif?: string,
    titleFont?: string,
    mono?: string,
    particles?: string,
    base?: string,
    layout?: string,
    transition?: string,
    class?: string,
    [key: string]: string | undefined
};

// `dark`, `theme: dark`, and `colorSchema: dark` are three spellings of the same intent, so both the HTML and
// PowerPoint palettes read the flag through one predicate rather than each re-checking all three keys.
export function isDarkConfig(config: DeckConfig): boolean {
    return config.dark === "true" || config.theme === "dark" || config.colorSchema === "dark";
}
