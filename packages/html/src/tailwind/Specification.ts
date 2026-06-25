export enum Utility {
    Text = "text-",
    Font = "font-",
    Background = "bg-",
    Gap = "gap-",
    GapColumn = "x-",
    GapRow = "y-",
    GridColumns = "grid-cols-",
    ColumnSpan = "col-span-",
    Rounded = "rounded-",
    Border = "border-",
    Margin = "m",
    Padding = "p"
}

export enum CssProperty {
    Display = "display",
    FlexDirection = "flexDirection",
    AlignItems = "alignItems",
    JustifyContent = "justifyContent",
    FontStyle = "fontStyle",
    TextDecorationLine = "textDecorationLine",
    TextAlign = "textAlign",
    Width = "width",
    Height = "height",
    FontSize = "fontSize",
    FontWeight = "fontWeight",
    Color = "color",
    BackgroundColor = "backgroundColor",
    Gap = "gap",
    ColumnGap = "columnGap",
    RowGap = "rowGap",
    Margin = "margin",
    MarginTop = "marginTop",
    MarginRight = "marginRight",
    MarginBottom = "marginBottom",
    MarginLeft = "marginLeft",
    Padding = "padding",
    PaddingTop = "paddingTop",
    PaddingRight = "paddingRight",
    PaddingBottom = "paddingBottom",
    PaddingLeft = "paddingLeft",
    GridTemplateColumns = "gridTemplateColumns",
    GridColumn = "gridColumn",
    BorderWidth = "borderWidth",
    BorderTopWidth = "borderTopWidth",
    BorderRightWidth = "borderRightWidth",
    BorderBottomWidth = "borderBottomWidth",
    BorderLeftWidth = "borderLeftWidth",
    BorderColor = "borderColor",
    BorderRadius = "borderRadius"
}

/* eslint-disable @typescript-eslint/naming-convention, @stylistic/quote-props */

export const FLAGS = {
    flex: [CssProperty.Display, "flex"],
    grid: [CssProperty.Display, "grid"],
    block: [CssProperty.Display, "block"],
    "inline-block": [CssProperty.Display, "inline-block"],
    hidden: [CssProperty.Display, "none"],
    "flex-col": [CssProperty.FlexDirection, "column"],
    "flex-row": [CssProperty.FlexDirection, "row"],
    "items-center": [CssProperty.AlignItems, "center"],
    "items-start": [CssProperty.AlignItems, "flex-start"],
    "items-end": [CssProperty.AlignItems, "flex-end"],
    "justify-center": [CssProperty.JustifyContent, "center"],
    "justify-start": [CssProperty.JustifyContent, "flex-start"],
    "justify-end": [CssProperty.JustifyContent, "flex-end"],
    "justify-between": [CssProperty.JustifyContent, "space-between"],
    italic: [CssProperty.FontStyle, "italic"],
    "not-italic": [CssProperty.FontStyle, "normal"],
    underline: [CssProperty.TextDecorationLine, "underline"],
    "no-underline": [CssProperty.TextDecorationLine, "none"],
    "text-center": [CssProperty.TextAlign, "center"],
    "text-left": [CssProperty.TextAlign, "left"],
    "text-right": [CssProperty.TextAlign, "right"],
    "text-justify": [CssProperty.TextAlign, "justify"],
    "w-full": [CssProperty.Width, "100%"],
    "h-full": [CssProperty.Height, "100%"],
    border: [CssProperty.BorderWidth, "1px"],
    rounded: [CssProperty.BorderRadius, "4px"]
} as const;

export const MARGIN_SIDE = {
    "": CssProperty.Margin,
    t: CssProperty.MarginTop,
    r: CssProperty.MarginRight,
    b: CssProperty.MarginBottom,
    l: CssProperty.MarginLeft
} as const;

export const PADDING_SIDE = {
    "": CssProperty.Padding,
    t: CssProperty.PaddingTop,
    r: CssProperty.PaddingRight,
    b: CssProperty.PaddingBottom,
    l: CssProperty.PaddingLeft
} as const;

export const BORDER_SIDE = {
    "": CssProperty.BorderWidth,
    t: CssProperty.BorderTopWidth,
    r: CssProperty.BorderRightWidth,
    b: CssProperty.BorderBottomWidth,
    l: CssProperty.BorderLeftWidth
} as const;

// Border-width utilities are their own scale (`border-2`, `border-l-4`), not the spacing scale.
export const BORDER_WIDTH = {
    "0": "0px",
    "2": "2px",
    "4": "4px",
    "8": "8px"
} as const;

/* eslint-enable @typescript-eslint/naming-convention, @stylistic/quote-props */

export const BORDER_DEFAULT_WIDTH = "1px";
