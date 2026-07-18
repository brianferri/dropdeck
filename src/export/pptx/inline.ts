import { HtmlTag, NodeField, textContent } from "@dropdeck/html";
import { styledRun } from "#/export/pptx/build";
import { renderInlineNodes } from "#/render/html";
import type { DomNode } from "@dropdeck/html";
import type { RunStyle } from "#/export/pptx/build";
import type { Palette } from "#/export/pptx/palette";
import type { Node } from "@dropdeck/pptx";

function emphasisStyle(
    base: RunStyle,
    bold: boolean,
    italic: boolean,
    link: boolean,
    palette: Palette
): RunStyle {
    const accented = bold || link;
    return { sizePx: base.sizePx, color: accented ? palette.accent1 : base.color, bold: bold || base.bold === true, italic: italic || base.italic === true, font: base.font };
}

function chipStyle(base: RunStyle, palette: Palette): RunStyle {
    return { sizePx: base.sizePx, color: palette.accent1, font: palette.mono, highlight: palette.chipColor };
}

// The inline parse has no HTML, so `<!-- ... -->` and `<br>` would survive as literal text; strip them here.
function clean(text: string): string {
    return text.replace(/<!--[\s\S]*?-->/g, "").replace(/<br\s*\/?>/gi, " ");
}

export function inlineRuns(text: string, base: RunStyle, palette: Palette): Array<Node> {
    return inlineRunsFromNodes(renderInlineNodes(clean(text)), base, palette);
}

type InlineFrame = { node: DomNode, bold: boolean, italic: boolean, link: boolean };

function pushReversed(
    stack: Array<InlineFrame>,
    nodes: ReadonlyArray<DomNode>,
    bold: boolean,
    italic: boolean,
    link: boolean
): void {
    for (let index = nodes.length - 1; index >= 0; index -= 1) stack.push({ node: nodes[index], bold, italic, link });
}

// Without collapsing, the soft line breaks Markdown leaves in a paragraph would each force a hard break.
function collapseWhitespace(text: string): string {
    let out = "";
    let space = false;
    for (let index = 0; index < text.length; index += 1) {
        const character = text.charAt(index);
        const isSpace = character === " " || character === "\n" || character === "\t" || character === "\r" || character === "\f";
        if (!isSpace) {
            out += character;
            space = false;
        } else if (!space) {
            out += " ";
            space = true;
        }
    }
    return out;
}

// The package paragraph model has no break element, so an explicit `<br>` must split into a new line/paragraph.
export function inlineSegments(
    nodes: ReadonlyArray<DomNode>,
    base: RunStyle,
    palette: Palette
): Array<Array<Node>> {
    const segments: Array<Array<Node>> = [[]];
    const stack: Array<InlineFrame> = [];
    pushReversed(stack, nodes, false, false, false);
    let guard = 0;
    while (stack.length > 0 && guard < 8192) {
        guard += 1;
        const frame = stack.pop();
        if (frame === undefined) break;
        const { node } = frame;
        const line = segments[segments.length - 1];
        if (NodeField.Text in node) {
            const collapsed = collapseWhitespace(node.text);
            if (collapsed.length > 0) line.push(styledRun(collapsed, emphasisStyle(base, frame.bold, frame.italic, frame.link, palette)));
            continue;
        }
        const { tag } = node;
        switch (tag) {
            case HtmlTag.Code:
                line.push(styledRun(textContent(node), chipStyle(base, palette)));
                break;
            case HtmlTag.Br:
                segments.push([]);
                break;
            default:
                pushReversed(stack, node.children, frame.bold || tag === HtmlTag.Strong || tag === HtmlTag.B, frame.italic || tag === HtmlTag.Em || tag === HtmlTag.I, frame.link || tag === HtmlTag.A);
                break;
        }
    }
    return segments;
}

export function inlineRunsFromNodes(
    nodes: ReadonlyArray<DomNode>,
    base: RunStyle,
    palette: Palette
): Array<Node> {
    const runs: Array<Node> = [];
    inlineSegments(nodes, base, palette).forEach((segment, index) => {
        if (index > 0) runs.push(styledRun(" ", base));
        for (const run of segment) runs.push(run);
    });
    return runs;
}
