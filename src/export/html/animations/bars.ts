import { barGrow, percent } from "#/export/html/animations/css";
import { AnimationKind } from "#/export/html/animations/animation";
import type { SlideAnimation } from "#/export/html/animations/animation";

const BAR_STAGGER_MS = 120;
const BAR_LEAD_MS = 200;

export const bars: SlideAnimation = {
    kind: AnimationKind.Bars,
    enter(elements) {
        elements.forEach((bar, index) => {
            bar.style.transition = "none";
            bar.style.width = "0";
            bar.getBoundingClientRect();
            bar.style.transition = barGrow((index * BAR_STAGGER_MS) + BAR_LEAD_MS);
            const width = bar.dataset.width ?? "0";
            setTimeout(() => {
                bar.style.width = percent(width);
            }, 40);
        });
    },
    finalize(elements) {
        elements.forEach((bar) => {
            bar.style.transition = "none";
            bar.style.width = percent(bar.dataset.width ?? "0");
        });
    }
};
