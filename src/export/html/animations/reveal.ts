import { revealRise, transitionOf } from "#/export/html/animations/css";
import { AnimationKind } from "#/export/html/animations/animation";
import { SlideTransition } from "#/animations/spec";
import type { SlideAnimation } from "#/export/html/animations/animation";

export const reveal: SlideAnimation = {
    kind: AnimationKind.Reveal,
    enter(elements, slide) {
        const morphing = slide.dataset.transition === SlideTransition.Morph;
        elements.forEach((el, index) => {
            const flat = el instanceof HTMLCanvasElement;
            const delayMs = morphing ? 0 : index * 60;
            el.style.transition = "none";
            el.style.opacity = "0";
            el.style.translate = flat ? "0" : revealRise();
            el.getBoundingClientRect();
            el.style.transition = transitionOf(flat ? ["opacity"] : ["opacity", "translate"], delayMs);
            el.style.opacity = "1";
            if (!flat) el.style.translate = "0";
        });
    },
    finalize(elements) {
        elements.forEach((element) => {
            element.style.transition = "none";
            element.style.opacity = "1";
            // Settle the rise by clearing `translate`, never `transform` -- an element's own transform survives.
            element.style.translate = "0";
        });
    }
};
