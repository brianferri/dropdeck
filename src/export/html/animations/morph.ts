import { flipRest, flipTransform, origin, transitionOf } from "#/export/html/animations/css";
import { morphKey } from "#/animations/spec";

// Self-animated components are skipped so their own motion wins over the morph glide.
const MORPH_BLOCKS = "h1, h2, h3, p, li, blockquote, figcaption";
const SELF_ANIMATED = ".bar-row, .metric";

// A text block glides between layout boxes (FLIP); an image glides between its CSS transforms, which carries the
// rotation and free scale/translate a bounding-box FLIP cannot express.
enum MorphKind { Flow = "flow", Transform = "transform" }

type MorphFrame =
    | { kind: MorphKind.Flow, rect: DOMRect }
    | { kind: MorphKind.Transform, matrix: string };

export function tagMorphTargets(deck: HTMLElement): void {
    deck.querySelectorAll<HTMLElement>(MORPH_BLOCKS).forEach((el) => {
        if (el.closest(SELF_ANIMATED) !== null) return;
        const text = el.textContent.trim();
        if (text !== "") el.dataset.morph = morphKey(text);
    });
    // A picture is keyed by its src: the same image is "the same thing" across slides even as its transform moves.
    deck.querySelectorAll<HTMLImageElement>("img").forEach((el) => {
        if (el.closest(SELF_ANIMATED) !== null) return;
        el.dataset.morph = `img:${el.getAttribute("src") ?? ""}`;
    });
}

// The content box, not the layout box: a full-width heading's frame would only move vertically and snap the text
// sideways, so morph by what is actually visible.
function contentRect(el: HTMLElement): DOMRect {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rect = range.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : el.getBoundingClientRect();
}

function frameOf(el: HTMLElement): MorphFrame {
    if (el instanceof HTMLImageElement) return { kind: MorphKind.Transform, matrix: getComputedStyle(el).transform };
    return { kind: MorphKind.Flow, rect: contentRect(el) };
}

// Captured while the slide is still visible: a hidden slide measures as zero.
export function captureMorph(slide: HTMLElement): Map<string, MorphFrame> {
    const frames = new Map<string, MorphFrame>();
    slide.querySelectorAll<HTMLElement>("[data-morph]").forEach((el) => {
        const key = el.dataset.morph;
        if (key !== undefined) frames.set(key, frameOf(el));
    });
    return frames;
}

// A matched element drops its own entrance (`data-animation`) before it glides -- the glide is its entrance, and a
// fade on top would step on it.
function unfade(el: HTMLElement): void {
    delete el.dataset.animation;
    el.style.opacity = "1";
}

function clearHintOn(el: HTMLElement): void {
    function clear(): void {
        el.style.willChange = "";
        el.removeEventListener("transitionend", clear);
    }
    el.addEventListener("transitionend", clear);
}

function flowInto(el: HTMLElement, from: DOMRect, scale: number): void {
    const to = contentRect(el);
    if (to.width === 0 || to.height === 0) return;
    const box = el.getBoundingClientRect();
    el.style.transformOrigin = origin((to.left - box.left) / scale, (to.top - box.top) / scale);
    el.style.willChange = "transform";
    el.style.transition = "none";
    el.style.transform = flipTransform((from.left - to.left) / scale, (from.top - to.top) / scale, from.width / to.width, from.height / to.height);
    el.getBoundingClientRect();
    el.style.transition = transitionOf(["transform"], 0);
    el.style.transform = flipRest();
    clearHintOn(el);
}

// The transform is in the stage's local space, so unlike the FLIP path it needs no `--scale`.
function transformInto(el: HTMLImageElement, fromMatrix: string): void {
    const rest = getComputedStyle(el).transform;
    el.style.willChange = "transform";
    el.style.transition = "none";
    el.style.transform = fromMatrix === "none" ? "" : fromMatrix;
    el.getBoundingClientRect();
    el.style.transition = transitionOf(["transform"], 0);
    el.style.transform = rest === "none" ? "" : rest;
    clearHintOn(el);
}

export function morphInto(before: Map<string, MorphFrame>, next: HTMLElement): void {
    // Client rects are screen px but an element's own transform is in the stage's local space (scaled by
    // `--scale`): divide or the FLIP glide lands off-target.
    const scale = parseFloat(getComputedStyle(next).getPropertyValue("--scale")) || 1;
    next.querySelectorAll<HTMLElement>("[data-morph]").forEach((el) => {
        const key = el.dataset.morph;
        if (key === undefined) return;
        const from = before.get(key);
        if (from === undefined) return;
        unfade(el);
        if (from.kind === MorphKind.Transform && el instanceof HTMLImageElement) transformInto(el, from.matrix);
        else if (from.kind === MorphKind.Flow) flowInto(el, from.rect, scale);
    });
}
