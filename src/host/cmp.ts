import { serializeAll } from "#/dom";
import { completionItemView, tooltipView } from "#/host/components/editor.component";
import { requireElement } from "#/host/dom";
import { CompletionKind, DIRECTIVES, FENCES, FRONTMATTER, FRONTMATTER_VALUES, LATEX_COMMANDS, MATH_TOKENS, SNIPPETS } from "#/host/language";
import { FormulaNotation, isFormulaNotation } from "#/ir";
import { has } from "#/support";
import { isAsciiLetter, isDigit } from "@dropdeck/common";
import type { CompletionItem } from "#/host/language";

export type Completion = {
    readonly items: ReadonlyArray<CompletionItem>,
    readonly from: number,
    readonly to: number
};

function isWordChar(ch: string): boolean {
    if (isAsciiLetter(ch) || isDigit(ch)) return true;
    return ch === "-" || ch === "_";
}

function lineStartOf(source: string, caret: number): number {
    let start = caret;
    while (start > 0 && source[start - 1] !== "\n") start -= 1;
    return start;
}

function trailingWord(text: string): string {
    let start = text.length;
    while (start > 0 && isWordChar(text[start - 1])) start -= 1;
    return text.slice(start);
}

// Mirrors the parser's `looksYaml`, so completion offers keys exactly where a block would parse as one.
function isKeyLine(line: string): boolean {
    if (line.trim() === "") return true;
    if (line.startsWith(" ") || line.startsWith("\t")) return true;
    const colon = line.indexOf(":");
    if (colon < 1) return false;
    const key = line.slice(0, colon).trimEnd();
    for (const ch of key) if (!isWordChar(ch)) return false;
    return key.length > 0;
}

function inFrontmatter(source: string, caret: number): boolean {
    const lineStart = lineStartOf(source, caret);
    if (lineStart === 0) return false;
    const lines = source.slice(0, lineStart - 1).split("\n");
    for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index];
        if (line.trim() === "---") return true;
        if (!isKeyLine(line)) return false;
    }
    return false;
}

function filterFrom(items: ReadonlyArray<CompletionItem>, typed: string, from: number, to: number): Completion | null {
    const lower = typed.toLowerCase();
    const matched = items.filter((item) => item.label.toLowerCase().startsWith(lower));
    if (matched.length === 0) return null;
    return { items: matched, from, to };
}

// Each ``` toggles in or out of a fence, so the last state before the line says which body -- if any -- holds the caret.
function enclosingFormula(source: string, lineStart: number): FormulaNotation | null {
    let lang: string | null = null;
    for (const line of source.slice(0, lineStart).split("\n")) {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("```")) lang = lang === null ? trimmed.slice(3).trim() : null;
    }
    if (lang === null) return null;
    return isFormulaNotation(lang) ? lang : null;
}

function formulaCompletions(notation: FormulaNotation, linePrefix: string, caret: number): Completion | null {
    switch (notation) {
        case FormulaNotation.Latex: {
            const command = trailingLatexCommand(linePrefix);
            return command === null ? null : filterFrom(LATEX_COMMANDS, command, caret - command.length, caret);
        }
        case FormulaNotation.Math: {
            const token = trailingWord(linePrefix);
            return token === "" ? null : filterFrom(MATH_TOKENS, token, caret - token.length, caret);
        }
    }
}

// A LaTeX completion only makes sense after the backslash that starts a command, so a bare word yields none.
function trailingLatexCommand(prefix: string): string | null {
    let start = prefix.length;
    while (start > 0 && isWordChar(prefix[start - 1])) start -= 1;
    if (prefix[start - 1] !== "\\") return null;
    return prefix.slice(start - 1);
}

function assetContext(linePrefix: string): { typed: string, from: number } | null {
    const open = linePrefix.lastIndexOf("](");
    if (open < 0) return null;
    const after = open + 2;
    if (linePrefix.includes(")", after)) return null;
    return { typed: linePrefix.slice(after), from: after };
}

function assetItems(keys: ReadonlyArray<string>): ReadonlyArray<CompletionItem> {
    return keys.map((key) => ({ label: key, insert: key, detail: "asset", doc: `Dropped asset \`${key}\`.`, kind: CompletionKind.Asset }));
}

export function completionsAt(source: string, caret: number, assets: ReadonlyArray<string> = []): Completion | null {
    const lineStart = lineStartOf(source, caret);
    const linePrefix = source.slice(lineStart, caret);

    if (assets.length > 0) {
        const asset = assetContext(linePrefix);
        if (asset !== null) return filterFrom(assetItems(assets), asset.typed, lineStart + asset.from, caret);
    }

    const trimmed = linePrefix.trimStart();
    const indent = linePrefix.length - trimmed.length;

    if (trimmed.startsWith("```")) return filterFrom(FENCES, trimmed.slice(3), lineStart + indent + 3, caret);
    if (trimmed.startsWith("::")) return filterFrom(DIRECTIVES, trimmed, lineStart + indent, caret);
    if (inFrontmatter(source, caret)) {
        const colon = trimmed.indexOf(":");
        if (colon < 0) return filterFrom(FRONTMATTER, trimmed, lineStart + indent, caret);
        const key = trimmed.slice(0, colon).trim();
        if (!has(key, FRONTMATTER_VALUES)) return null;
        const typed = trimmed.slice(colon + 1).trimStart();
        return filterFrom(FRONTMATTER_VALUES[key], typed, caret - typed.length, caret);
    }

    const formula = enclosingFormula(source, lineStart);
    if (formula !== null) return formulaCompletions(formula, linePrefix, caret);

    const word = trailingWord(linePrefix);
    if (word.length > 0 && word === trimmed) return filterFrom(SNIPPETS, word, caret - word.length, caret);
    return null;
}

type SnippetStop = { start: number, end: number };
type Snippet = { readonly text: string, readonly stops: ReadonlyArray<SnippetStop> };

type RawStop = { readonly order: number, readonly start: number, readonly end: number };

function bracedStop(insert: string, at: number): { order: number, placeholder: string, next: number } | null {
    if (insert[at + 1] !== "{") return null;
    let cursor = at + 2;
    let digits = "";
    while (cursor < insert.length && isDigit(insert[cursor])) {
        digits += insert[cursor];
        cursor += 1;
    }
    if (digits === "" || insert[cursor] !== ":") return null;
    cursor += 1;
    let placeholder = "";
    while (cursor < insert.length && insert[cursor] !== "}") {
        placeholder += insert[cursor];
        cursor += 1;
    }
    if (insert[cursor] !== "}") return null;
    return { order: Number(digits), placeholder, next: cursor + 1 };
}

function bareStop(insert: string, at: number): { order: number, next: number } | null {
    if (at + 1 >= insert.length) return null;
    const digit = insert[at + 1];
    if (digit < "0" || digit > "9") return null;
    return { order: Number(digit), next: at + 2 };
}

// Tab-stops are visited in ascending number, with `$0` (the exit point) always last.
function byStopOrder(a: RawStop, b: RawStop): number {
    const left = a.order === 0 ? Infinity : a.order;
    const right = b.order === 0 ? Infinity : b.order;
    return left - right;
}

export function parseSnippet(insert: string): Snippet {
    let text = "";
    const found: Array<RawStop> = [];
    let at = 0;
    while (at < insert.length) {
        if (insert[at] !== "$") {
            text += insert[at];
            at += 1;
            continue;
        }
        const braced = bracedStop(insert, at);
        if (braced !== null) {
            const start = text.length;
            text += braced.placeholder;
            found.push({ order: braced.order, start, end: text.length });
            at = braced.next;
            continue;
        }
        const bare = bareStop(insert, at);
        if (bare !== null) {
            found.push({ order: bare.order, start: text.length, end: text.length });
            at = bare.next;
            continue;
        }
        text += insert[at];
        at += 1;
    }
    const ordered = found.slice().sort(byStopOrder).map((stop) => ({ start: stop.start, end: stop.end }));
    return { text, stops: ordered };
}

const MIRROR_PROPS = [
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "letter-spacing",
    "line-height",
    "tab-size",
    "word-spacing"
];

// Plain column arithmetic cannot place the caret once a line soft-wraps, so a hidden mirror measures it.
function caretCoords(text: HTMLTextAreaElement, position: number): { left: number, top: number, height: number } {
    const scroll = text.parentElement;
    if (scroll === null) return { left: 0, top: 0, height: 0 };
    const computed = getComputedStyle(text);
    const mirror = document.createElement("div");
    for (const prop of MIRROR_PROPS) mirror.style.setProperty(prop, computed.getPropertyValue(prop));
    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.boxSizing = "content-box";
    mirror.style.width = computed.getPropertyValue("width");
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordBreak = "break-word";
    mirror.style.left = "0";
    mirror.style.top = "0";
    mirror.textContent = text.value.slice(0, position);
    const marker = document.createElement("span");
    marker.textContent = text.value.slice(position) || ".";
    mirror.appendChild(marker);
    scroll.appendChild(mirror);
    const result = { left: marker.offsetLeft, top: marker.offsetTop, height: parseFloat(computed.lineHeight) || marker.offsetHeight };
    scroll.removeChild(mirror);
    return result;
}

function adjustStops(stops: Array<SnippetStop>, from: number, to: number, delta: number): void {
    for (const stop of stops) {
        if (stop.start >= to) {
            stop.start += delta;
            stop.end += delta;
        } else if (stop.end >= from) stop.end += delta;
        if (stop.end < stop.start) stop.end = stop.start;
    }
}

// `afterEdit` re-renders the deck after an accept, since setting `text.value` programmatically fires no input
// event; `assets` is read live so destination completions reflect the currently loaded deck's files.
export function mountCompletions(text: HTMLTextAreaElement, afterEdit: () => void, assets: () => ReadonlyArray<string>): void {
    const popup = requireElement("editorPopup");
    const list = requireElement("editorPopupList");
    const docPanel = requireElement("editorCompletionDoc");
    // Half a root em, so the popup-to-doc gap scales with the font rather than being a fixed pixel count.
    const gap = parseFloat(getComputedStyle(document.documentElement).fontSize) / 2;
    let current: Completion | null = null;
    let activeItem = 0;
    let stops: Array<SnippetStop> | null = null;
    let stopIndex = 0;
    let lastLength = text.value.length;
    let editFrom = 0;
    let editTo = 0;

    function render(): void {
        if (current === null) return;
        list.innerHTML = serializeAll(current.items.map((item, index) => completionItemView(item, index, index === activeItem)));
        const active = list.children[activeItem];
        if (!(active instanceof HTMLElement)) return;
        const bottom = active.offsetTop + active.offsetHeight;
        if (active.offsetTop < list.scrollTop) list.scrollTop = active.offsetTop;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    }

    // Its width comes from CSS, so it is revealed before measuring; it flips left when the right would overflow.
    function paintDoc(): void {
        if (current === null) return;
        docPanel.innerHTML = serializeAll(tooltipView(current.items[activeItem]));
        docPanel.classList.remove("hidden");
        const width = docPanel.offsetWidth;
        const overflowsRight = popup.offsetLeft + popup.offsetWidth + gap + width > window.innerWidth;
        const left = overflowsRight ? popup.offsetLeft - width - gap : popup.offsetLeft + popup.offsetWidth + gap;
        docPanel.style.left = `${left}px`;
        docPanel.style.top = `${popup.offsetTop}px`;
    }

    function show(next: Completion): void {
        current = next;
        activeItem = 0;
        render();
        const coords = caretCoords(text, next.to);
        popup.style.left = `${coords.left - text.scrollLeft}px`;
        popup.style.top = `${coords.top + coords.height - text.scrollTop}px`;
        popup.classList.remove("hidden");
        paintDoc();
    }

    function hide(): void {
        current = null;
        popup.classList.add("hidden");
        docPanel.classList.add("hidden");
    }

    function refresh(): void {
        const next = completionsAt(text.value, text.selectionStart, assets());
        if (next === null) hide();
        else show(next);
    }

    function accept(): void {
        if (current === null) return;
        const item = current.items[activeItem];
        const snippet = parseSnippet(item.insert);
        const { from } = current;
        const tail = text.value.slice(current.to);
        text.value = text.value.slice(0, from) + snippet.text + tail;
        stops = snippet.stops.map((stop) => ({ start: from + stop.start, end: from + stop.end }));
        lastLength = text.value.length;
        hide();
        const head = stops.at(0);
        if (head !== undefined) {
            text.setSelectionRange(head.start, head.end);
            stopIndex = 1;
        } else text.setSelectionRange(from + snippet.text.length, from + snippet.text.length);
        afterEdit();
    }

    function nextStop(): boolean {
        if (stops === null || stopIndex >= stops.length) return false;
        const stop = stops[stopIndex];
        text.setSelectionRange(stop.start, stop.end);
        stopIndex += 1;
        return true;
    }

    function moveActive(delta: number): void {
        if (current === null) return;
        const count = current.items.length;
        activeItem = (activeItem + delta + count) % count;
        render();
        paintDoc();
    }

    function onPopupKey(event: KeyboardEvent): void {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(-1);
        } else if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            accept();
        } else if (event.key === "Escape") {
            event.preventDefault();
            hide();
        } else if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") hide();
    }

    text.addEventListener("keydown", (event) => {
        if (current !== null) {
            onPopupKey(event);
            return;
        }
        if (event.key === "Tab" && nextStop()) {
            event.preventDefault();
            return;
        }
        if (event.key === "Escape") stops = null;
    });

    text.addEventListener("beforeinput", () => {
        editFrom = text.selectionStart;
        editTo = text.selectionEnd;
    });

    text.addEventListener("input", () => {
        if (stops !== null) adjustStops(stops, editFrom, editTo, text.value.length - lastLength);
        lastLength = text.value.length;
        refresh();
    });

    popup.addEventListener("mousedown", (event) => {
        event.preventDefault();
        const item = (event.target as HTMLElement).closest<HTMLElement>(".completion-item");
        if (item === null) return;
        activeItem = Number(item.getAttribute("data-index"));
        accept();
    });

    popup.addEventListener("mouseover", (event) => {
        const item = (event.target as HTMLElement).closest<HTMLElement>(".completion-item");
        if (item === null) return;
        const index = Number(item.getAttribute("data-index"));
        if (index === activeItem) return;
        activeItem = index;
        render();
        paintDoc();
    });

    // A press anywhere but the popup dismisses it, like Escape -- moving the caret by clicking the textarea does
    // not blur it, so the blur handler alone would leave a stale popup open.
    document.addEventListener("mousedown", (event) => {
        if (current === null) return;
        if (popup.contains(event.target as Node | null)) return;
        hide();
    });

    text.addEventListener("blur", hide);
}
