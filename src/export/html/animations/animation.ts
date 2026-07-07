export enum AnimationKind {
    Reveal = "reveal",
    Bars = "bars",
    Counter = "counter",
    Media = "media",
    ChartGrow = "chart-grow",
    ChartDraw = "chart-draw",
    ChartWipe = "chart-wipe"
}

// Handed the elements that declared its `kind` via `data-animation`; it never queries the DOM, so it stays
// decoupled from other components' markup. `finalize` is the instant end state (export, editor, a morph's exit).
export type SlideAnimation = {
    readonly kind: AnimationKind,
    enter: (elements: ReadonlyArray<HTMLElement>, slide: HTMLElement) => void,
    finalize: (elements: ReadonlyArray<HTMLElement>) => void
};
