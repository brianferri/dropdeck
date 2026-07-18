import { BlockKind, SlideLayout } from "#/ir";
import { LayoutHint } from "#/config";
import type { Max, Min } from "#/typings/arithmetic";
import type { Slide } from "#/ir";

function columnCount<const Total extends number, const Cap extends number>(total: Total, cap: Cap): Min<Max<Total, 1>, Cap> {
    return Math.min(Math.max(total, 1), cap) as Min<Max<Total, 1>, Cap>;
}

// Four cards read best as a 2x2 square rather than a 1x4 row.
export function gridCols<const Count extends number>(count: Count): Count extends 4 ? 2 : Min<Max<Count, 1>, 3> {
    return (count === 4 ? 2 : columnCount(count, 3)) as Count extends 4 ? 2 : Min<Max<Count, 1>, 3>;
}

export function metricCols<const Count extends number>(count: Count): Min<Max<Count, 1>, 4> {
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
    for (const block of slide.blocks) {
        switch (block.kind) {
            case BlockKind.Prose: parts.push(block.markdown); break;
            case BlockKind.Html:
            case BlockKind.Cards:
            case BlockKind.Metrics:
            case BlockKind.Bars:
            case BlockKind.Chart:
            case BlockKind.Code:
            case BlockKind.Formula:
            case BlockKind.Columns:
                break;
        }
    }

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
