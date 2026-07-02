import type { DeckConfig } from "#/config";

export enum Motion {
    Fade = "fade",
    Wipe = "wipe",
    Counter = "counter"
}

export enum Trigger {
    Enter = "enter",
    Step = "step",
    Loop = "loop"
}

export type Animation = {
    readonly motion: Motion,
    readonly trigger: Trigger,
    readonly delayMs: number,
    readonly durationMs: number
};

export enum SlideTransition {
    None = "none",
    Fade = "fade",
    Morph = "morph"
}

type Trimmed<S extends string> = S extends ` ${infer Rest}` ? Trimmed<Rest> : S extends `${infer Rest} ` ? Trimmed<Rest> : S;

export function morphKey<const T extends string>(text: T): Lowercase<Trimmed<T>> {
    return text.trim().toLowerCase() as Lowercase<Trimmed<T>>;
}

// The `morph:` prefix marks a shape morphable, so the timing pass drops its entrance on a morph slide (the
// transition moves it instead); PowerPoint tweens shapes that share a name.
export function morphName<const T extends string>(text: T): `morph:${Lowercase<Trimmed<T>>}` {
    return `morph:${morphKey(text)}`;
}

// One clock for a whole slide transition: the morph glide and every entrance fade that rides alongside it share
// this duration and easing, so they begin and finish together instead of each animation timing itself.
export const TRANSITION_MS = 600;
export const TRANSITION_EASING = "ease-in-out";

export function resolveTransition(frontmatter: DeckConfig): SlideTransition {
    switch (frontmatter.transition) {
        case SlideTransition.Morph: return SlideTransition.Morph;
        case SlideTransition.None: return SlideTransition.None;
        case undefined:
        default: return SlideTransition.Fade;
    }
}
