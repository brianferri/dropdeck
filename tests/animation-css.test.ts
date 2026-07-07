import { test, expect } from "vitest";
import {
    barGrow, chartTransition, clipRight, flipRest, flipTransform, origin,
    percent, revealRise, rgbColor, transitionOf, turn, verticalScale
} from "#/export/html/animations/css";

test("transitionOf joins one entry per property, dropping a zero delay", () => {
    expect(transitionOf(["opacity", "translate"], 60)).toBe("opacity 600ms ease-in-out 60ms, translate 600ms ease-in-out 60ms");
    expect(transitionOf(["transform"], 0)).toBe("transform 600ms ease-in-out");
});

test("barGrow and chartTransition use the decelerating curve", () => {
    expect(barGrow(200)).toBe("width 700ms cubic-bezier(0.22, 1, 0.36, 1) 200ms");
    expect(chartTransition("transform", 700, 0)).toBe("transform 700ms cubic-bezier(0.22, 1, 0.36, 1)");
    expect(chartTransition("clip-path", 900, 150)).toBe("clip-path 900ms cubic-bezier(0.22, 1, 0.36, 1) 150ms");
});

test("the value builders serialize to their CSS forms", () => {
    expect(revealRise()).toBe("0 18px");
    expect(percent("50")).toBe("50%");
    expect(verticalScale(0)).toBe("scaleY(0)");
    expect(clipRight(100)).toBe("inset(0 100% 0 0)");
    expect(clipRight(0)).toBe("inset(0 0% 0 0)");
    expect(turn(1)).toBe("1turn");
    expect(origin(0, 18)).toBe("0px 18px");
    expect(rgbColor(10, 20, 30)).toBe("rgb(10, 20, 30)");
});

test("flipTransform composes a translate and scale; flipRest is the identity", () => {
    expect(flipTransform(5, 8, 2, 3)).toBe("translate3d(5px, 8px, 0) scale(2, 3)");
    expect(flipRest()).toBe("translate3d(0px, 0px, 0) scale(1, 1)");
});
