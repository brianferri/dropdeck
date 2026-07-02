import { finalizeSlide, playSlide } from "#/export/html/animations/entrance";
import { captureMorph, morphInto } from "#/export/html/animations/morph";
import { pauseMedia } from "#/export/html/animations/media";
import { SlideTransition } from "#/animations/spec";

// `instant` drops the leaving slide's cross-fade -- a morph or a cut, where it should just vanish
// (the arriving slide's opaque background covers it), not fade over the top.
function leave(previous: HTMLElement | null, instant: boolean): void {
    if (previous === null) return;
    previous.classList.remove("active");
    previous.classList.toggle("instant", instant);
    pauseMedia(previous);
}

function fade(previous: HTMLElement | null, next: HTMLElement): void {
    leave(previous, false);
    next.classList.remove("instant");
    next.classList.add("active");
    playSlide(next);
}

function cut(previous: HTMLElement | null, next: HTMLElement): void {
    leave(previous, true);
    next.classList.add("instant");
    next.classList.add("active");
    finalizeSlide(next);
}

function morph(previous: HTMLElement | null, next: HTMLElement): void {
    // Settle and measure the leaving slide before it deactivates -- a hidden slide measures as zero, so its glide
    // rects have to be read while it is still shown.
    let before: ReturnType<typeof captureMorph> | null = null;
    if (previous !== null) {
        finalizeSlide(previous);
        before = captureMorph(previous);
    }
    leave(previous, true);
    next.classList.add("instant");
    next.classList.add("active");
    if (before !== null) morphInto(before, next);
    playSlide(next);
}

type TransitionRun = (previous: HTMLElement | null, next: HTMLElement) => void;

function transitionKind(value: string | undefined): SlideTransition {
    switch (value) {
        case SlideTransition.Morph: return SlideTransition.Morph;
        case SlideTransition.None: return SlideTransition.None;
        case undefined:
        default: return SlideTransition.Fade;
    }
}

// Add a transition with a `SlideTransition` member and a case here; the switch returns a runner, so it is
// exhaustive with no default -- a new member is a compile error until it is handled.
function runnerFor(kind: SlideTransition): TransitionRun {
    switch (kind) {
        case SlideTransition.Morph: return morph;
        case SlideTransition.None: return cut;
        case SlideTransition.Fade: return fade;
    }
}

export function transitionTo(previous: HTMLElement | null, next: HTMLElement): void {
    runnerFor(transitionKind(next.dataset.transition))(previous, next);
}
