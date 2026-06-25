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
    class?: string,
    [key: string]: string | undefined
};
