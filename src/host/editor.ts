import { TokenKind, tokenize } from "@dropdeck/markdown";
import { isAsciiLetter, isHexDigit } from "@dropdeck/common";
import { serializeAll, span, text as textNode } from "#/dom";
import { declaration } from "@dropdeck/html/css";
import { parseHex } from "#/hex";
import { COLOR_HEX, isColorName } from "#/formula";
import { ColorFunction } from "#/formula/math";
import { ColorCommand } from "#/formula/latex";
import { isFormulaNotation } from "#/ir";
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

// A `#rgb`/`#rrggbb` colour, but only when it stands alone -- a non-hex letter right after means a longer word
// (e.g. an id like `#header`), not a colour, so it falls through to plain text. The hex scan stays in-bounds
// because `isHexDigit` reads past the string end as a throw, not a miss.
function hexColor(value: string, at: number): InlineHit | null {
    let count = 0;
    while (at + 1 + count < value.length && isHexDigit(value[at + 1 + count])) count += 1;
    if (count !== 3 && count !== 6) return null;
    if (isAsciiLetter(value[at + 1 + count])) return null;
    return { end: at + 1 + count, cls: "color", color: value.slice(at, at + 1 + count) };
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const rgb = parseHex(hex);
    return rgb === null ? null : { r: rgb[0], g: rgb[1], b: rgb[2] };
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

const COLOR_OPENERS = [`${ColorFunction.Color}(`, `${ColorCommand.TextColor}{`] as const;

// A swatch paints the color behind its own text with contrasting ink, the same treatment a hex literal gets.
function colorSwatch(label: string, hex: string): DomNode {
    return span({ class: "tok-color", style: [declaration("background-color", hex), declaration("color", contrastInk(hex))] }, label);
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
        if (hit.color !== undefined) nodes.push(colorSwatch(value.slice(at, hit.end), hit.color));
        else nodes.push(span({ class: `tok-${hit.cls}` }, value.slice(at, hit.end)));
        at = hit.end;
    }
    if (run) nodes.push(textNode(run));
    return nodes;
}

// A color directive's argument, when it names a supported color, split from the opener that stays literal.
function colorNameAt(value: string, at: number): { opener: string, name: string, hex: string } | null {
    for (const opener of COLOR_OPENERS) {
        if (!value.startsWith(opener, at)) continue;
        let end = at + opener.length;
        let name = "";
        while (end < value.length && isAsciiLetter(value[end])) {
            name += value[end];
            end += 1;
        }
        if (!isColorName(name)) continue;
        return { opener, name, hex: `#${COLOR_HEX[name]}` };
    }
    return null;
}

// A formula fence stays literal except for a color directive's name, which is swatched so the color reads inline.
function formulaColorNodes(value: string): ReadonlyArray<DomNode> {
    const nodes: Array<DomNode> = [];
    let run = "";
    let at = 0;
    while (at < value.length) {
        const hit = colorNameAt(value, at);
        if (hit === null) {
            run += value[at];
            at += 1;
            continue;
        }
        run += hit.opener;
        nodes.push(textNode(run));
        run = "";
        nodes.push(colorSwatch(hit.name, hit.hex));
        at += hit.opener.length + hit.name.length;
    }
    if (run) nodes.push(textNode(run));
    return nodes;
}

// The language after a fence's ``` marker, or "" for a bare fence; drives whether its body is a formula.
function fenceLangOf(fenceLine: string): string {
    const trimmed = fenceLine.trimStart();
    return trimmed.startsWith("```") ? trimmed.slice(3).trim() : "";
}

// A code-fence interior stays literal so its `**`/`[]` are not read as emphasis or links; a formula fence is the
// exception, where a color directive's name is swatched. `fenceLang` is null outside any fence.
function tokenNodes(source: string, token: Token, fenceLang: string | null): ReadonlyArray<DomNode> {
    const value = source.slice(token.start, token.end);
    switch (token.kind) {
        case TokenKind.Separator:
        case TokenKind.Heading:
        case TokenKind.Fence:
        case TokenKind.Quote:
        case TokenKind.List:
            return [span({ class: `tok-${token.kind}` }, value)];
        case TokenKind.Text:
            if (fenceLang !== null) return isFormulaNotation(fenceLang) ? formulaColorNodes(value) : [textNode(value)];
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
    let fenceLang: string | null = null;
    for (const token of tokenize(source)) {
        for (const node of tokenNodes(source, token, fenceLang)) nodes.push(node);
        switch (token.kind) {
            case TokenKind.Fence:
                fenceLang = fenceLang === null ? fenceLangOf(source.slice(token.start, token.end)) : null;
                break;
            case TokenKind.Text:
            case TokenKind.Separator:
            case TokenKind.Heading:
            case TokenKind.Quote:
            case TokenKind.List:
                break;
        }
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
