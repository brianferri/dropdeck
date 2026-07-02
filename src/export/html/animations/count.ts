import { AnimationKind } from "#/export/html/animations/animation";
import type { SlideAnimation } from "#/export/html/animations/animation";

export const counter: SlideAnimation = {
    kind: AnimationKind.Counter,
    enter(elements) {
        elements.forEach((el) => {
            const target = parseInt(el.dataset.count ?? "", 10);
            if (Number.isNaN(target)) return;
            let current = 0;
            const step = target / 26;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = String(Math.round(current));
            }, 32);
        });
    },
    finalize(elements) {
        elements.forEach((el) => {
            el.textContent = el.dataset.count ?? el.textContent;
        });
    }
};
