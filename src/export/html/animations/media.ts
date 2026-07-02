import { AnimationKind } from "#/export/html/animations/animation";
import type { SlideAnimation } from "#/export/html/animations/animation";

function eachMedia(elements: ReadonlyArray<HTMLElement>, play: (m: HTMLMediaElement) => void): void {
    for (const element of elements) {
        if (element instanceof HTMLMediaElement) {
            try {
                play(element);
            } catch {
                // A browser may refuse programmatic control; the slide is still correct, just not playing.
            }
        }
    }
}

export const media: SlideAnimation = {
    kind: AnimationKind.Media,
    enter(elements) {
        eachMedia(elements, (m) => {
            m.currentTime = 0;
            m.play().catch(() => undefined);
        });
    },
    finalize(elements) {
        eachMedia(elements, (m) => {
            m.pause();
            m.currentTime = 0;
        });
    }
};

// Called by the transition, not the entrance, so it queries the slide directly rather than a pre-grouped list.
export function pauseMedia(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLMediaElement>("video,audio").forEach((element) => {
        try {
            element.pause();
        } catch {
            // Nothing to pause / already gone.
        }
    });
}
