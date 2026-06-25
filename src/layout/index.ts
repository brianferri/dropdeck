import { BlockKind, SlideLayout } from "#/ir";
import { LayoutHint } from "#/config";
import type { Slide } from "#/ir";

function columnCount(total: number, cap: number): number {
    return Math.min(Math.max(total, 1), cap);
}

// Four cards read best as a 2x2 square rather than a 1x4 row.
export function gridCols(count: number): number {
    return count === 4 ? 2 : columnCount(count, 3);
}

export function metricCols(count: number): number {
    return columnCount(count, 4);
}

export function barFraction(percent: number): number {
    return Math.min(Math.max(percent, 0), 100) / 100;
}

// Matches list markers and table pipes: prose with these wants the content layout, not a centered section.
const STRUCTURED = /(^|\n)\s*([-*+]|\d+\.)\s|\|/;

export function isProse(slide: Slide): boolean {
    return slide.blocks.every((block) => block.kind === BlockKind.Prose && !STRUCTURED.test(block.markdown));
}

export function proseText(slide: Slide): string {
    const parts: Array<string> = [];
    for (const block of slide.blocks) if (block.kind === BlockKind.Prose) parts.push(block.markdown);

    return parts.join("\n\n").trim();
}

export function resolveLayout(slide: Slide, index: number, total: number): SlideLayout {
    const { layout } = slide.frontmatter;
    if (layout === LayoutHint.Default) return SlideLayout.Content;
    const wantsCenter = layout === LayoutHint.Center || (slide.frontmatter.class ?? "").includes("text-center");
    const eligible = wantsCenter || isProse(slide);
    if (index === 0 && eligible) return SlideLayout.Cover;
    if (index === total - 1 && eligible) return SlideLayout.Section;
    if (wantsCenter || (layout === undefined && isProse(slide))) return SlideLayout.Section;
    return SlideLayout.Content;
}
