import { flipRest, flipTransform, origin, rgbColor, transitionOf } from "#/export/html/animations/css";
import { TRANSITION_MS, morphKey } from "#/animations/spec";

type Morphable = HTMLElement | SVGElement;

// Self-animated components are skipped so their own motion wins over the morph glide.
const MORPH_BLOCKS = "h1, h2, h3, p, li, blockquote, figcaption";
const SELF_ANIMATED = ".bar-row, .metric";

// The SVG presentation attributes that read well when interpolated: colours, stroke, and the CSS-animatable
// geometry of the basic shapes. Line endpoints (`x1`..) are not CSS geometry, so a changed line snaps instead.
const SVG_TWEEN_PROPS = ["fill", "stroke", "stroke-width", "opacity", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height"];
const SVG_COLOR_PROPS = new Set(["fill", "stroke"]);

// A block glides between layout boxes (FLIP). An image or root SVG carrying its own `transform` glides between
// those matrices instead. A shape inside a keyed SVG interpolates its presentation attributes in place.
enum MorphKind { Flow = "flow", Transform = "transform", Svg = "svg" }

type MorphFrame =
    | { kind: MorphKind.Flow, rect: DOMRect }
    | { kind: MorphKind.Transform, matrix: string }
    | { kind: MorphKind.Svg, props: Map<string, string> };

function isSvgShape(el: Morphable): el is SVGElement {
    return el instanceof SVGElement && !(el instanceof SVGSVGElement);
}

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
    // Inside a keyed SVG each shape is keyed by its kind and order, so the nth circle tracks the nth circle across
    // slides. Ordering persistent shapes first keeps matches intuitive; an explicit `data-morph` overrides.
    deck.querySelectorAll<SVGSVGElement>("svg[data-morph]").forEach((svg) => {
        const rootKey = svg.dataset.morph ?? "";
        const counts = new Map<string, number>();
        svg.querySelectorAll<SVGElement>("*").forEach((child) => {
            if (child.dataset.morph !== undefined) return;
            const index = counts.get(child.tagName) ?? 0;
            counts.set(child.tagName, index + 1);
            child.dataset.morph = `${rootKey}:${child.tagName}:${index}`;
        });
    });
}

// The content box, not the layout box: a full-width heading's frame would only move vertically and snap the text
// sideways, so morph by what is actually visible.
function contentRect(el: Morphable): DOMRect {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rect = range.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : el.getBoundingClientRect();
}

// An image or SVG glides by its own box. Its content box would track the drawn shapes, so a root SVG whose inner
// shapes change would scale as a whole -- double-counting the per-shape morph that already runs inside it.
function morphRect(el: Morphable): DOMRect {
    if (el instanceof HTMLImageElement || el instanceof SVGSVGElement) return el.getBoundingClientRect();
    return contentRect(el);
}

function svgProps(el: SVGElement): Map<string, string> {
    const props = new Map<string, string>();
    for (const prop of SVG_TWEEN_PROPS) {
        const value = el.getAttribute(prop);
        if (value !== null) props.set(prop, value);
    }
    return props;
}

function frameOf(el: Morphable): MorphFrame {
    if (isSvgShape(el)) return { kind: MorphKind.Svg, props: svgProps(el) };
    if (el instanceof HTMLImageElement || el instanceof SVGSVGElement) {
        const matrix = getComputedStyle(el).transform;
        if (matrix !== "none") return { kind: MorphKind.Transform, matrix };
    }
    // A layout-positioned image or SVG (in a column, say) has no transform to interpolate, so it glides by its box.
    return { kind: MorphKind.Flow, rect: morphRect(el) };
}

// Captured while the slide is still visible: a hidden slide measures as zero.
export function captureMorph(slide: HTMLElement): Map<string, MorphFrame> {
    const frames = new Map<string, MorphFrame>();
    slide.querySelectorAll<Morphable>("[data-morph]").forEach((el) => {
        const key = el.dataset.morph;
        if (key !== undefined) frames.set(key, frameOf(el));
    });
    return frames;
}

// A matched element drops its own entrance (`data-animation`) before it glides -- the glide is its entrance, and a
// fade on top would step on it.
function unfade(el: Morphable): void {
    delete el.dataset.animation;
    el.style.opacity = "1";
}

function clearHintOn(el: Morphable): void {
    function clear(): void {
        el.style.willChange = "";
        el.removeEventListener("transitionend", clear);
    }
    el.addEventListener("transitionend", clear);
}

function parseHexColor(value: string): [number, number, number] | null {
    if (!value.startsWith("#")) return null;
    const hex = value.length === 4 ? value[1] + value[1] + value[2] + value[2] + value[3] + value[3] : value.slice(1);
    if (hex.length !== 6) return null;
    const packed = parseInt(hex, 16);
    if (Number.isNaN(packed)) return null;
    return [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255];
}

// Handles both the hex an author writes and the `rgb(..)` a running tween leaves on the attribute mid-flight.
function parseColor(value: string): [number, number, number] | null {
    const hex = parseHexColor(value);
    if (hex !== null) return hex;
    if (!value.startsWith("rgb")) return null;
    const parts = value.slice(value.indexOf("(") + 1, value.indexOf(")")).split(",");
    if (parts.length < 3) return null;
    const channels: [number, number, number] = [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)];
    return channels.some((channel) => Number.isNaN(channel)) ? null : channels;
}

function interpolate(prop: string, from: string, to: string, t: number): string {
    if (SVG_COLOR_PROPS.has(prop)) {
        const a = parseColor(from);
        const b = parseColor(to);
        // A non-colour value (`none`, a name) has no channels to cross, so hold it and let the shape snap at the end.
        if (a === null || b === null) return t < 1 ? from : to;
        const red = Math.round(a[0] + ((b[0] - a[0]) * t));
        const green = Math.round(a[1] + ((b[1] - a[1]) * t));
        const blue = Math.round(a[2] + ((b[2] - a[2]) * t));
        return rgbColor(red, green, blue);
    }
    const start = parseFloat(from);
    const end = parseFloat(to);
    if (Number.isNaN(start) || Number.isNaN(end)) return to;
    return String(start + ((end - start) * t));
}

function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - (((2 - (2 * t)) ** 2) / 2);
}

// setAttribute is honoured for SVG geometry (`r`, `cx`, ..) in every browser, unlike the CSS geometry properties a
// transition would need -- Firefox ignores those -- so shapes tween attribute-by-attribute on a rAF clock instead.
function animateSvg(el: SVGElement, pairs: ReadonlyArray<readonly [string, string, string]>): void {
    if (pairs.length === 0) return;
    // Commit the start values before the first paint, so the shape never flashes its own target for a frame.
    for (const [prop, from] of pairs) el.setAttribute(prop, from);
    const startMs = performance.now();
    function step(nowMs: number): void {
        const t = Math.min((nowMs - startMs) / TRANSITION_MS, 1);
        const eased = easeInOut(t);
        // At rest restore the authored value, so the attribute stays hex rather than the tween's `rgb(..)`.
        for (const [prop, from, to] of pairs) el.setAttribute(prop, t < 1 ? interpolate(prop, from, to, eased) : to);
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function flowInto(el: Morphable, from: DOMRect, scale: number): void {
    const to = morphRect(el);
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
function transformInto(el: HTMLImageElement | SVGSVGElement, fromMatrix: string): void {
    const rest = getComputedStyle(el).transform;
    el.style.willChange = "transform";
    el.style.transition = "none";
    el.style.transform = fromMatrix === "none" ? "" : fromMatrix;
    el.getBoundingClientRect();
    el.style.transition = transitionOf(["transform"], 0);
    el.style.transform = rest === "none" ? "" : rest;
    clearHintOn(el);
}

// A shape present on both slides tweens from its previous attributes to its own -- so fill and stroke gradient
// between colours and the geometry eases across.
function svgInto(el: SVGElement, from: Map<string, string>): void {
    const pairs: Array<readonly [string, string, string]> = [];
    for (const prop of SVG_TWEEN_PROPS) {
        const to = el.getAttribute(prop);
        const start = from.get(prop);
        if (to !== null && start !== undefined && to !== start) pairs.push([prop, start, to]);
    }
    animateSvg(el, pairs);
}

// A shape the previous slide did not have fades in rather than popping.
function svgFadeIn(el: SVGElement): void {
    animateSvg(el, [["opacity", "0", el.getAttribute("opacity") ?? "1"]]);
}

function morphElement(el: Morphable, from: MorphFrame | undefined, scale: number): void {
    if (isSvgShape(el)) {
        if (from?.kind === MorphKind.Svg) svgInto(el, from.props);
        else svgFadeIn(el);
        return;
    }
    if (from === undefined) return;
    unfade(el);
    if (from.kind === MorphKind.Transform && (el instanceof HTMLImageElement || el instanceof SVGSVGElement)) transformInto(el, from.matrix);
    else if (from.kind === MorphKind.Flow) flowInto(el, from.rect, scale);
}

export function morphInto(before: Map<string, MorphFrame>, next: HTMLElement): void {
    // Client rects are screen px but an element's own transform is in the stage's local space (scaled by
    // `--scale`): divide or the FLIP glide lands off-target.
    const scale = parseFloat(getComputedStyle(next).getPropertyValue("--scale")) || 1;
    next.querySelectorAll<Morphable>("[data-morph]").forEach((el) => {
        const key = el.dataset.morph;
        if (key !== undefined) morphElement(el, before.get(key), scale);
    });
}
