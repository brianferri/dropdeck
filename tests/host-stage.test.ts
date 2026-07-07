// @vitest-environment happy-dom
import { test, expect, beforeEach } from "vitest";
import { mountStage } from "#/host/stage";

const STAGE_WIDTH = 1180;
const STAGE_HEIGHT = 663.75;

beforeEach(() => { document.body.innerHTML = ""; });

function scaleOf(stage: HTMLElement): number {
    return Number(stage.style.getPropertyValue("--scale"));
}

test("mountStage fits the deck to the smaller of the width and height ratios on mount", () => {
    const stage = document.createElement("div");
    document.body.appendChild(stage);
    mountStage(stage);
    const expected = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    expect(scaleOf(stage)).toBeCloseTo(expected);
});

test("mountStage recomputes the scale on a window resize", () => {
    const stage = document.createElement("div");
    document.body.appendChild(stage);
    mountStage(stage);
    stage.style.setProperty("--scale", "999");
    window.dispatchEvent(new Event("resize"));
    expect(scaleOf(stage)).not.toBe(999);
});
