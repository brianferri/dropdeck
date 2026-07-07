// @vitest-environment happy-dom
import { test, expect } from "vitest";
import { reveal } from "#/export/html/animations/reveal";
import { bars } from "#/export/html/animations/bars";
import { counter } from "#/export/html/animations/count";
import { chartDraw, chartGrow, chartWipe } from "#/export/html/animations/chart";
import { finalizeSlide, playSlide } from "#/export/html/animations/entrance";

function div(): HTMLElement {
    return document.createElement("div");
}

test("reveal enter settles opacity and translate to their resting state", () => {
    const el = div();
    reveal.enter([el], div());
    expect(el.style.opacity).toBe("1");
    expect(el.style.translate).toBe("0");
    expect(el.style.transition).toContain("opacity");
});

test("reveal finalize jumps straight to visible with no transition", () => {
    const el = div();
    reveal.finalize([el]);
    expect(el.style.opacity).toBe("1");
    expect(el.style.transition).toBe("none");
});

test("bars finalize sets the fill width from its data-width", () => {
    const el = div();
    el.dataset.width = "95";
    bars.finalize([el]);
    expect(el.style.width).toBe("95%");
});

test("chartGrow rises a bar to full scale, then settles on finalize", () => {
    const el = div();
    chartGrow.enter([el], div());
    expect(el.style.transformOrigin).toBe("bottom");
    expect(el.style.transform).toBe("scaleY(1)");
    expect(el.style.transition).toContain("transform");
    chartGrow.finalize([el]);
    expect(el.style.transform).toBe("none");
});

test("chartDraw reveals the plot, then clears the clip on finalize", () => {
    const el = div();
    chartDraw.enter([el], div());
    expect(el.style.clipPath).toBe("inset(0 0% 0 0)");
    chartDraw.finalize([el]);
    expect(el.style.clipPath).toBe("none");
});

test("chartWipe sweeps the mask to a full turn, then clears it", () => {
    const el = div();
    chartWipe.enter([el], div());
    expect(el.style.getPropertyValue("--chart-wipe")).toBe("1turn");
    chartWipe.finalize([el]);
    expect(el.style.mask).toBe("none");
});

test("counter finalize sets the text to its data-count target", () => {
    const el = div();
    el.dataset.count = "42";
    el.textContent = "0";
    counter.finalize([el]);
    expect(el.textContent).toBe("42");
});

test("playSlide animates every [data-animation] element under a slide", () => {
    const slide = div();
    const panel = div();
    panel.dataset.animation = "reveal";
    const bar = div();
    bar.dataset.animation = "chart-grow";
    slide.append(panel, bar);
    playSlide(slide);
    expect(panel.style.opacity).toBe("1");
    expect(bar.style.transform).toBe("scaleY(1)");
    finalizeSlide(slide);
    expect(bar.style.transform).toBe("none");
});
