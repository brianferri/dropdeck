import { BORDER_DEFAULT_WIDTH, BORDER_SIDE, BORDER_WIDTH, CssProperty, FLAGS, MARGIN_SIDE, PADDING_SIDE, Utility } from "./Specification.js";
import { COLORS, FONT_SIZES, FONT_WEIGHTS, RADIUS, SPACING } from "./Theme.js";

type Spacing = typeof SPACING;
type Colors = typeof COLORS;
type FontSizes = typeof FONT_SIZES;
type FontWeights = typeof FONT_WEIGHTS;
type Radii = typeof RADIUS;
type BorderWidths = typeof BORDER_WIDTH;
type MarginSides = typeof MARGIN_SIDE;
type PaddingSides = typeof PADDING_SIDE;
type BorderSides = typeof BORDER_SIDE;
type Flags = typeof FLAGS;

// A `Record` over `never` keys rather than `{}` so it merges as the identity without tripping the empty-object lint.
type NoDecl = Record<never, string>;

type Merge<A, B> = Omit<A, keyof B> & B;
type Prettify<T> = { [K in keyof T]: T[K] } & {};

type MergeAll<List extends ReadonlyArray<object>, Acc = NoDecl> =
    List extends readonly [infer Head extends object, ...infer Rest extends ReadonlyArray<object>] ? MergeAll<Rest, Merge<Acc, Head>> : Acc;

type LookupDecl<Rest extends string, Table, Property extends CssProperty> = Rest extends keyof Table ? Record<Property, Table[Rest]> : NoDecl;

type FlagDecl<Pair extends readonly [CssProperty, string]> = Record<Pair[0], Pair[1]>;

type TextUtil<Rest extends string> = MergeAll<[
    LookupDecl<Rest, FontSizes, CssProperty.FontSize>,
    LookupDecl<Rest, Colors, CssProperty.Color>
]>;

type GapUtil<Rest extends string> = MergeAll<[
    Rest extends `${Utility.GapColumn}${infer N}` ? LookupDecl<N, Spacing, CssProperty.ColumnGap> : NoDecl,
    Rest extends `${Utility.GapRow}${infer N}` ? LookupDecl<N, Spacing, CssProperty.RowGap> : NoDecl,
    LookupDecl<Rest, Spacing, CssProperty.Gap>
]>;

type BorderSideWidth<Rest extends string> = Rest extends `${infer Side}-${infer N}` ? Side extends keyof BorderSides ? LookupDecl<N, BorderWidths, BorderSides[Side]> : NoDecl : NoDecl;
type BorderSideDefault<Rest extends string> = Rest extends "" ? NoDecl : Rest extends keyof BorderSides ? Record<BorderSides[Rest], typeof BORDER_DEFAULT_WIDTH> : NoDecl;

type BorderUtil<Rest extends string> = MergeAll<[
    LookupDecl<Rest, Colors, CssProperty.BorderColor>,
    LookupDecl<Rest, BorderWidths, CssProperty.BorderWidth>,
    BorderSideWidth<Rest>,
    BorderSideDefault<Rest>
]>;

type SpacingUtil<Rest extends string, Sides extends Record<string, CssProperty>, X1 extends CssProperty, X2 extends CssProperty, Y1 extends CssProperty, Y2 extends CssProperty> =
    Rest extends `${infer Side}-${infer N}`
        ? N extends keyof Spacing
            ? Side extends "x" ? Record<X1 | X2, Spacing[N]>
                : Side extends "y" ? Record<Y1 | Y2, Spacing[N]>
                    : Side extends keyof Sides ? Record<Sides[Side], Spacing[N]> : NoDecl
            : NoDecl
        : NoDecl;

type MarginUtil<Rest extends string> = SpacingUtil<Rest, MarginSides, CssProperty.MarginLeft, CssProperty.MarginRight, CssProperty.MarginTop, CssProperty.MarginBottom>;
type PaddingUtil<Rest extends string> = SpacingUtil<Rest, PaddingSides, CssProperty.PaddingLeft, CssProperty.PaddingRight, CssProperty.PaddingTop, CssProperty.PaddingBottom>;

type FlagMatch<T extends string> = T extends keyof Flags ? FlagDecl<Flags[T]> : NoDecl;
type TextMatch<T extends string> = T extends `${Utility.Text}${infer Rest}` ? TextUtil<Rest> : NoDecl;
type FontMatch<T extends string> = T extends `${Utility.Font}${infer Rest}` ? LookupDecl<Rest, FontWeights, CssProperty.FontWeight> : NoDecl;
type BackgroundMatch<T extends string> = T extends `${Utility.Background}${infer Rest}` ? LookupDecl<Rest, Colors, CssProperty.BackgroundColor> : NoDecl;
type GapMatch<T extends string> = T extends `${Utility.Gap}${infer Rest}` ? GapUtil<Rest> : NoDecl;
type GridColumnsMatch<T extends string> = T extends `${Utility.GridColumns}${infer N}` ? Record<CssProperty.GridTemplateColumns, `repeat(${N}, minmax(0, 1fr))`> : NoDecl;
type ColumnSpanMatch<T extends string> = T extends `${Utility.ColumnSpan}${infer N}` ? Record<CssProperty.GridColumn, `span ${N} / span ${N}`> : NoDecl;
type RoundedMatch<T extends string> = T extends `${Utility.Rounded}${infer Rest}` ? LookupDecl<Rest, Radii, CssProperty.BorderRadius> : NoDecl;
type BorderMatch<T extends string> = T extends `${Utility.Border}${infer Rest}` ? BorderUtil<Rest> : NoDecl;
type MarginMatch<T extends string> = T extends `${Utility.Margin}${infer Rest}` ? MarginUtil<Rest> : NoDecl;
type PaddingMatch<T extends string> = T extends `${Utility.Padding}${infer Rest}` ? PaddingUtil<Rest> : NoDecl;

type ResolveClass<T extends string> = MergeAll<[
    FlagMatch<T>,
    TextMatch<T>,
    FontMatch<T>,
    BackgroundMatch<T>,
    GapMatch<T>,
    GridColumnsMatch<T>,
    ColumnSpanMatch<T>,
    RoundedMatch<T>,
    BorderMatch<T>,
    MarginMatch<T>,
    PaddingMatch<T>
]>;

type ResolveAll<S extends string, Acc = NoDecl> =
    S extends `${infer Head} ${infer Rest}` ? ResolveAll<Rest, Merge<Acc, ResolveClass<Head>>>
        : S extends "" ? Acc
            : Merge<Acc, ResolveClass<S>>;

export type Tailwind<S extends string> = string extends S ? Record<string, string> : Prettify<ResolveAll<S>>;

function lookup<V>(table: Record<string, V>, key: string): V | null {
    return Object.hasOwn(table, key) ? table[key] : null;
}

function classTokens(classes: string): Array<string> {
    const out: Array<string> = [];
    let current = "";
    for (const character of classes) {
        const space = character === " " || character === "\t" || character === "\n" || character === "\r" || character === "\f";
        if (space) {
            if (current !== "") out.push(current);
            current = "";
        } else current += character;
    }
    if (current !== "") out.push(current);
    return out;
}

function textUtil(rest: string): Record<string, string> {
    const size = lookup(FONT_SIZES, rest);
    if (size !== null) return { [CssProperty.FontSize]: size };
    const color = lookup(COLORS, rest);
    if (color !== null) return { [CssProperty.Color]: color };
    return {};
}

function gapUtil(rest: string): Record<string, string> {
    if (rest.startsWith(Utility.GapColumn)) return tableValue(SPACING, rest.slice(Utility.GapColumn.length), CssProperty.ColumnGap);
    if (rest.startsWith(Utility.GapRow)) return tableValue(SPACING, rest.slice(Utility.GapRow.length), CssProperty.RowGap);
    return tableValue(SPACING, rest, CssProperty.Gap);
}

function tableValue(table: Record<string, string>, key: string, property: CssProperty): Record<string, string> {
    const value = lookup(table, key);
    return value !== null ? { [property]: value } : {};
}

export type ColorClass = {
    readonly property: CssProperty,
    readonly family: string,
    readonly shade: string,
    readonly hex: string
};

const COLOR_PREFIXES: ReadonlyArray<readonly [Utility, CssProperty]> = [
    [Utility.Text, CssProperty.Color],
    [Utility.Background, CssProperty.BackgroundColor],
    [Utility.Border, CssProperty.BorderColor]
];

export function colorClass(token: string): ColorClass | null {
    for (const [prefix, property] of COLOR_PREFIXES) {
        if (!token.startsWith(prefix)) continue;
        const rest = after(token, prefix);
        const hex = lookup(COLORS, rest);
        if (hex === null) return null;
        const dash = rest.lastIndexOf("-");
        return { property, family: rest.slice(0, dash), shade: rest.slice(dash + 1), hex };
    }
    return null;
}

function countAfter(token: string, prefix: Utility): number | null {
    if (!token.startsWith(prefix)) return null;
    const value = Number(after(token, prefix));
    return Number.isInteger(value) && value > 0 ? value : null;
}

export function gridColumns(token: string): number | null {
    return countAfter(token, Utility.GridColumns);
}

export function columnSpan(token: string): number | null {
    return countAfter(token, Utility.ColumnSpan);
}

function sideSpacing(rest: string, sides: Record<string, CssProperty>, x1: CssProperty, x2: CssProperty, y1: CssProperty, y2: CssProperty): Record<string, string> {
    const dash = rest.indexOf("-");
    if (dash === -1) return {};
    const side = rest.slice(0, dash);
    const value = lookup(SPACING, rest.slice(dash + 1));
    if (value === null) return {};
    if (side === "x") return { [x1]: value, [x2]: value };
    if (side === "y") return { [y1]: value, [y2]: value };
    const property = lookup(sides, side);
    return property !== null ? { [property]: value } : {};
}

function borderUtil(rest: string): Record<string, string> {
    const color = lookup(COLORS, rest);
    if (color !== null) return { [CssProperty.BorderColor]: color };
    const width = lookup(BORDER_WIDTH, rest);
    if (width !== null) return { [CssProperty.BorderWidth]: width };
    const dash = rest.indexOf("-");
    if (dash !== -1) {
        const property = lookup(BORDER_SIDE, rest.slice(0, dash));
        const sideWidth = lookup(BORDER_WIDTH, rest.slice(dash + 1));
        return property !== null && sideWidth !== null ? { [property]: sideWidth } : {};
    }
    const sideProperty = rest === "" ? null : lookup(BORDER_SIDE, rest);
    return sideProperty !== null ? { [sideProperty]: BORDER_DEFAULT_WIDTH } : {};
}

function after(token: string, prefix: Utility): string {
    return token.slice(prefix.length);
}

function resolveClass(token: string): Record<string, string> {
    const flag = lookup<readonly [CssProperty, string]>(FLAGS, token);
    if (flag !== null) return { [flag[0]]: flag[1] };
    if (token.startsWith(Utility.Text)) return textUtil(after(token, Utility.Text));
    if (token.startsWith(Utility.Font)) return tableValue(FONT_WEIGHTS, after(token, Utility.Font), CssProperty.FontWeight);
    if (token.startsWith(Utility.Background)) return tableValue(COLORS, after(token, Utility.Background), CssProperty.BackgroundColor);
    if (token.startsWith(Utility.Gap)) return gapUtil(after(token, Utility.Gap));
    if (token.startsWith(Utility.GridColumns)) return { [CssProperty.GridTemplateColumns]: `repeat(${after(token, Utility.GridColumns)}, minmax(0, 1fr))` };
    if (token.startsWith(Utility.ColumnSpan)) {
        const span = after(token, Utility.ColumnSpan);
        return { [CssProperty.GridColumn]: `span ${span} / span ${span}` };
    }
    if (token.startsWith(Utility.Rounded)) return tableValue(RADIUS, after(token, Utility.Rounded), CssProperty.BorderRadius);
    if (token.startsWith(Utility.Border)) return borderUtil(after(token, Utility.Border));
    if (token.startsWith(Utility.Margin)) return sideSpacing(after(token, Utility.Margin), MARGIN_SIDE, CssProperty.MarginLeft, CssProperty.MarginRight, CssProperty.MarginTop, CssProperty.MarginBottom);
    if (token.startsWith(Utility.Padding)) return sideSpacing(after(token, Utility.Padding), PADDING_SIDE, CssProperty.PaddingLeft, CssProperty.PaddingRight, CssProperty.PaddingTop, CssProperty.PaddingBottom);
    return {};
}

// The cast is sound only because the runtime mirrors the type-level `Tailwind` branch for branch.
export function resolve<const S extends string>(classes: S): Tailwind<S> {
    const out: Record<string, string> = {};
    for (const token of classTokens(classes)) Object.assign(out, resolveClass(token));
    return out as Tailwind<S>;
}
