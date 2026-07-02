import { bars } from "#/export/html/animations/bars";
import { counter } from "#/export/html/animations/count";
import { media } from "#/export/html/animations/media";
import { reveal } from "#/export/html/animations/reveal";
import { has } from "#/support";
import { AnimationKind } from "#/export/html/animations/animation";
import type { SlideAnimation } from "#/export/html/animations/animation";

const ANIMATIONS: ReadonlyArray<SlideAnimation> = [
    reveal,
    bars,
    counter,
    media
];

function groupsOf(slide: HTMLElement): Record<AnimationKind, Array<HTMLElement>> {
    const groups: Record<AnimationKind, Array<HTMLElement>> = {
        [AnimationKind.Reveal]: [],
        [AnimationKind.Bars]: [],
        [AnimationKind.Counter]: [],
        [AnimationKind.Media]: []
    };
    slide.querySelectorAll<HTMLElement>("[data-animation]").forEach((element) => {
        const kind = element.dataset.animation;
        if (kind === undefined) return;
        if (has(kind, groups)) groups[kind].push(element);
    });
    return groups;
}

export function playSlide(slide: HTMLElement): void {
    const groups = groupsOf(slide);
    for (const animation of ANIMATIONS) animation.enter(groups[animation.kind], slide);
}

export function finalizeSlide(slide: HTMLElement): void {
    const groups = groupsOf(slide);
    for (const animation of ANIMATIONS) animation.finalize(groups[animation.kind]);
}

export function finalizeSlides(deck: HTMLElement): void {
    deck.querySelectorAll<HTMLElement>(".slide").forEach(finalizeSlide);
}
