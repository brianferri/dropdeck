import { chartTransition, clipRight, turn, verticalScale } from "#/export/html/animations/css";
import { AnimationKind } from "#/export/html/animations/animation";
import type { SlideAnimation } from "#/export/html/animations/animation";

const GROW_STAGGER_MS = 80;
const GROW_LEAD_MS = 150;
const GROW_MS = 700;
const DRAW_LEAD_MS = 150;
const DRAW_MS = 900;
const WIPE_LEAD_MS = 150;
const WIPE_MS = 900;

export const chartGrow: SlideAnimation = {
    kind: AnimationKind.ChartGrow,
    enter(elements) {
        const collapsed = verticalScale(0);
        const full = verticalScale(1);
        elements.forEach((el, index) => {
            el.style.transformOrigin = "bottom";
            el.style.transition = "none";
            el.style.transform = collapsed;
            el.getBoundingClientRect();
            el.style.transition = chartTransition("transform", GROW_MS, (index * GROW_STAGGER_MS) + GROW_LEAD_MS);
            el.style.transform = full;
        });
    },
    finalize(elements) {
        elements.forEach((el) => {
            el.style.transition = "none";
            el.style.transform = "none";
        });
    }
};

export const chartDraw: SlideAnimation = {
    kind: AnimationKind.ChartDraw,
    enter(elements) {
        const hidden = clipRight(100);
        const shown = clipRight(0);
        const transition = chartTransition("clip-path", DRAW_MS, DRAW_LEAD_MS);
        elements.forEach((el) => {
            el.style.transition = "none";
            el.style.clipPath = hidden;
            el.getBoundingClientRect();
            el.style.transition = transition;
            el.style.clipPath = shown;
        });
    },
    finalize(elements) {
        elements.forEach((el) => {
            el.style.transition = "none";
            el.style.clipPath = "none";
        });
    }
};

const WIPE_MASK = "conic-gradient(from 0deg, #fff var(--chart-wipe), transparent var(--chart-wipe))";
let wipeRegistered = false;

function registerWipe(): void {
    if (wipeRegistered) return;
    wipeRegistered = true;
    try {
        window.CSS.registerProperty({ name: "--chart-wipe", syntax: "<angle>", inherits: false, initialValue: "0turn" });
    } catch {
        // Registered on an earlier play; the definition is identical, so nothing to do.
    }
}

export const chartWipe: SlideAnimation = {
    kind: AnimationKind.ChartWipe,
    enter(elements) {
        if (elements.length > 0) registerWipe();
        const start = turn(0);
        const end = turn(1);
        const transition = chartTransition("--chart-wipe", WIPE_MS, WIPE_LEAD_MS);
        elements.forEach((el) => {
            el.style.mask = WIPE_MASK;
            el.style.transition = "none";
            el.style.setProperty("--chart-wipe", start);
            el.getBoundingClientRect();
            el.style.transition = transition;
            el.style.setProperty("--chart-wipe", end);
        });
    },
    finalize(elements) {
        elements.forEach((el) => {
            el.style.transition = "none";
            el.style.mask = "none";
        });
    }
};
