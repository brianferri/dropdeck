import { TokenKind, tokenize } from "@dropdeck/markdown";
import { serializeAll, span, text as textNode } from "#/dom";
import { declaration } from "@dropdeck/html/css";
import { slideStarts } from "#/front";
import { mountCompletions } from "#/host/cmp";
import { tooltipView } from "#/host/components/editor.component";
import { requireElement, setRootProperty } from "#/host/dom";
import { describe } from "#/host/language";
import type { Token } from "@dropdeck/markdown";
import type { DomNode } from "#/dom";
import type { TokenClass } from "#/host/components/editor.component";
import type { CompletionItem } from "#/host/language";
import type { Presenter } from "#/presenter";

// `::name::` is a dropdeck column directive, not CommonMark, so the package tokenizes it as Text; the editor
// recognizes its own extension here when it reads a Text token.
function isDirective(value: string): boolean {
    const trimmed = value.trimEnd();
    return trimmed.startsWith("::") && trimmed.endsWith("::") && trimmed.length > 4;
}

// A `color` hit carries its hex so the overlay can paint that swatch behind the code; the rest only need a class.
type InlineHit = { readonly end: number, readonly cls: TokenClass, readonly color?: string };

function isHexDigit(ch: string | undefined): boolean {
    if (ch === undefined) return false;
    if (ch >= "0" && ch <= "9") return true;
    if (ch >= "a" && ch <= "f") return true;
    return ch >= "A" && ch <= "F";
}

function isLetter(ch: string | undefined): boolean {
    if (ch === undefined) return false;
    if (ch >= "a" && ch <= "z") return true;
    return ch >= "A" && ch <= "Z";
}

// A `#rgb`/`#rrggbb` colour, but only when it stands alone -- a non-hex letter right after means a longer word
// (e.g. an id like `#header`), not a colour, so it falls through to plain text.
function hexColor(value: string, at: number): InlineHit | null {
    let count = 0;
    while (isHexDigit(value[at + 1 + count])) count += 1;
    if (count !== 3 && count !== 6) return null;
    if (isLetter(value[at + 1 + count])) return null;
    return { end: at + 1 + count, cls: "color", color: value.slice(at, at + 1 + count) };
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    let body = hex.slice(1);
    if (body.length === 3) body = body[0] + body[0] + body[1] + body[1] + body[2] + body[2];
    if (body.length !== 6) return null;
    const r = parseInt(body.slice(0, 2), 16);
    const g = parseInt(body.slice(2, 4), 16);
    const b = parseInt(body.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return { r, g, b };
}

// YIQ brightness picks black ink on light swatches and white on dark ones, so the hex code stays legible on it.
function contrastInk(hex: string): "#000" | "#fff" {
    const rgb = hexToRgb(hex);
    if (rgb === null) return "#000";
    const brightness = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    return brightness >= 128 ? "#000" : "#fff";
}

function delimitedLink(value: string, at: number, cls: TokenClass): InlineHit | null {
    const labelEnd = value.indexOf("]", at);
    if (labelEnd < 0) return null;
    if (value[labelEnd + 1] !== "(") return null;
    const destEnd = value.indexOf(")", labelEnd + 2);
    if (destEnd < 0) return null;
    return { end: destEnd + 1, cls };
}

function wrapped(value: string, at: number, open: string, close: string, cls: TokenClass): InlineHit | null {
    const closeAt = value.indexOf(close, at + open.length);
    if (closeAt < 0) return null;
    return { end: closeAt + close.length, cls };
}

// `**` is tried before `*` so bold wins over emphasis; `![` before `[` so an image is not read as a link.
function inlineMatch(value: string, at: number): InlineHit | null {
    if (value.startsWith("![", at)) return delimitedLink(value, at + 2, "image");
    if (value.startsWith("[", at)) return delimitedLink(value, at + 1, "link");
    if (value.startsWith("`", at)) return wrapped(value, at, "`", "`", "code");
    if (value.startsWith("**", at)) return wrapped(value, at, "**", "**", "bold");
    if (value.startsWith("*", at)) return wrapped(value, at, "*", "*", "italic");
    if (value.startsWith("_", at)) return wrapped(value, at, "_", "_", "italic");
    if (value.startsWith("<", at)) return wrapped(value, at, "<", ">", "html");
    if (value.startsWith("#", at)) return hexColor(value, at);
    return null;
}

// `at` always advances (a hit ends past it, a miss steps one char), so the scan is bounded by the value length.
function inlineNodes(value: string): ReadonlyArray<DomNode> {
    const nodes: Array<DomNode> = [];
    let run = "";
    let at = 0;
    while (at < value.length) {
        const hit = inlineMatch(value, at);
        if (hit === null) {
            run += value[at];
            at += 1;
            continue;
        }
        if (run) nodes.push(textNode(run));
        run = "";
        if (hit.color !== undefined)
            nodes.push(span({ class: "tok-color", style: [declaration("background-color", hit.color), declaration("color", contrastInk(hit.color))] }, value.slice(at, hit.end)));
        else nodes.push(span({ class: `tok-${hit.cls}` }, value.slice(at, hit.end)));
        at = hit.end;
    }
    if (run) nodes.push(textNode(run));
    return nodes;
}

// Code-fence interior is left literal so its `**`/`[]` are not mistaken for emphasis or links.
function tokenNodes(source: string, token: Token, inFence: boolean): ReadonlyArray<DomNode> {
    const value = source.slice(token.start, token.end);
    switch (token.kind) {
        case TokenKind.Separator:
        case TokenKind.Heading:
        case TokenKind.Fence:
        case TokenKind.Quote:
        case TokenKind.List:
            return [span({ class: `tok-${token.kind}` }, value)];
        case TokenKind.Text:
            if (inFence) return [textNode(value)];
            return isDirective(value) ? [span({ class: "tok-directive" }, value)] : inlineNodes(value);
    }
}

const WIDTH_DEFAULT_VW = 42;
const WIDTH_MIN_VW = 18;
const WIDTH_MAX_VW = 72;
const UPDATE_DELAY_MS = 80;

// A vw split keeps the deck proportional on viewport resize for free; the stage reads the panel's rendered
// width when it refits, so dispatching a resize after each width change is all the coordination needed.
function setWidth(vw: number): void {
    const clamped = Math.min(WIDTH_MAX_VW, Math.max(WIDTH_MIN_VW, vw));
    setRootProperty("--editor-width", `${clamped}vw`);
    window.dispatchEvent(new Event("resize"));
}

// Spans line up character-for-character behind the transparent textarea; a trailing newline keeps a space to
// hold its own line.
export function highlight(source: string): string {
    const nodes: Array<DomNode> = [];
    let inFence = false;
    for (const token of tokenize(source)) {
        for (const node of tokenNodes(source, token, inFence)) nodes.push(node);
        if (token.kind === TokenKind.Fence) inFence = !inFence;
    }
    const overlay = serializeAll(nodes);
    return source.endsWith("\n") ? `${overlay} ` : overlay;
}

// The overlay is geometrically identical to the textarea, so hit-testing its span rects locates the hovered token.
function hoveredItem(layer: HTMLElement, clientX: number, clientY: number): CompletionItem | null {
    for (const el of layer.querySelectorAll<HTMLElement>(".tok-directive, .tok-fence")) {
        for (const rect of Array.from(el.getClientRects())) {
            if (clientX < rect.left || clientX > rect.right) continue;
            if (clientY < rect.top || clientY > rect.bottom) continue;
            const entry = describe(el.textContent);
            if (entry !== null) return entry;
        }
    }
    return null;
}

function mountHover(scroll: HTMLElement, layer: HTMLElement, tooltip: HTMLElement): void {
    scroll.addEventListener("mousemove", (event) => {
        const entry = hoveredItem(layer, event.clientX, event.clientY);
        if (entry === null) {
            tooltip.classList.add("hidden");
            return;
        }
        tooltip.innerHTML = serializeAll(tooltipView(entry));
        const rect = scroll.getBoundingClientRect();
        tooltip.style.left = `${event.clientX - rect.left + 12}px`;
        tooltip.style.top = `${event.clientY - rect.top + 16}px`;
        tooltip.classList.remove("hidden");
    });
    scroll.addEventListener("mouseleave", () => { tooltip.classList.add("hidden"); });
}

export function mountEditor(deck: Presenter): void {
    const toggle = requireElement("editorToggle");
    const panel = requireElement("editor");
    const text = requireElement<HTMLTextAreaElement>("editorText");
    const highlightLayer = requireElement<HTMLPreElement>("editorHighlight");
    const gutter = requireElement("editorGutter");
    const errorBar = requireElement("editorError");

    function paint(): void {
        highlightLayer.innerHTML = highlight(text.value);
        highlightLayer.scrollTop = text.scrollTop;
        highlightLayer.scrollLeft = text.scrollLeft;
    }

    function slideAtCursor(): number {
        const at = text.selectionStart;
        const index = slideStarts(text.value).findLastIndex((start) => start <= at);
        return index < 0 ? 1 : index + 1;
    }

    function open(): void {
        text.value = deck.source;
        errorBar.textContent = "";
        paint();
        panel.classList.remove("hidden");
        setWidth(WIDTH_DEFAULT_VW);
        const caret = slideStarts(text.value)[deck.index - 1] ?? 0;
        text.focus();
        text.setSelectionRange(caret, caret);
    }

    function close(): void {
        panel.classList.add("hidden");
        setRootProperty("--editor-width", "0px");
        window.dispatchEvent(new Event("resize"));
    }

    toggle.addEventListener("click", () => {
        if (panel.classList.contains("hidden")) open();
        else close();
    });

    function syncCursor(): void {
        deck.show(slideAtCursor());
    }
    text.addEventListener("keyup", syncCursor);
    text.addEventListener("click", syncCursor);
    text.addEventListener("scroll", () => {
        highlightLayer.scrollTop = text.scrollTop;
        highlightLayer.scrollLeft = text.scrollLeft;
    });

    let timer = 0;
    function scheduleUpdate(): void {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => { errorBar.textContent = deck.update(text.value, slideAtCursor()) ?? ""; }, UPDATE_DELAY_MS);
    }
    function afterEdit(): void {
        paint();
        scheduleUpdate();
    }
    text.addEventListener("input", afterEdit);

    mountCompletions(text, afterEdit, () => Array.from(deck.assets.keys()));
    mountHover(requireElement("editorScroll"), highlightLayer, requireElement("editorTooltip"));

    let dragging = false;
    gutter.addEventListener("mousedown", (event) => {
        event.preventDefault();
        dragging = true;
        gutter.classList.add("active");
        document.body.style.userSelect = "none";
    });
    window.addEventListener("mousemove", (event) => {
        if (!dragging) return;
        setWidth((event.clientX / window.innerWidth) * 100);
    });
    window.addEventListener("mouseup", () => {
        if (!dragging) return;
        dragging = false;
        gutter.classList.remove("active");
        document.body.style.userSelect = "";
    });
}
