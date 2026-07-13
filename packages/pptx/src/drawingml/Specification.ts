/* eslint-disable @typescript-eslint/naming-convention -- ST_* mirror the ECMA-376 schema names verbatim. */

export enum ST_TextUnderlineType {
    None = "none",
    Words = "words",
    Single = "sng",
    Double = "dbl",
    Heavy = "heavy",
    Dotted = "dotted",
    DottedHeavy = "dottedHeavy",
    Dash = "dash",
    DashHeavy = "dashHeavy",
    DashLong = "dashLong",
    DashLongHeavy = "dashLongHeavy",
    DotDash = "dotDash",
    DotDashHeavy = "dotDashHeavy",
    DotDotDash = "dotDotDash",
    DotDotDashHeavy = "dotDotDashHeavy",
    Wavy = "wavy",
    WavyHeavy = "wavyHeavy",
    WavyDouble = "wavyDbl"
}

export enum ST_TextStrikeType {
    NoStrike = "noStrike",
    SingleStrike = "sngStrike",
    DoubleStrike = "dblStrike"
}

export enum ST_TextCapsType {
    None = "none",
    Small = "small",
    All = "all"
}

export enum ST_TextAlignType {
    Left = "l",
    Center = "ctr",
    Right = "r",
    Justify = "just",
    JustifyLow = "justLow",
    Distributed = "dist",
    ThaiDistributed = "thaiDist"
}

export enum ST_TextAnchoringType {
    Top = "t",
    Center = "ctr",
    Bottom = "b",
    Justify = "just",
    Distributed = "dist"
}

export enum ST_TextWrappingType {
    None = "none",
    Square = "square"
}

export enum ST_TextVerticalType {
    Horizontal = "horz",
    Vertical = "vert",
    Vertical270 = "vert270",
    WordArtVertical = "wordArtVert",
    EastAsianVertical = "eaVert",
    MongolianVertical = "mongolianVert",
    WordArtVerticalRtl = "wordArtVertRtl"
}

export enum ST_TextVertOverflowType {
    Overflow = "overflow",
    Ellipsis = "ellipsis",
    Clip = "clip"
}

export enum ST_TextHorzOverflowType {
    Overflow = "overflow",
    Clip = "clip"
}

export enum ST_TextFontAlignType {
    Auto = "auto",
    Top = "t",
    Center = "ctr",
    Baseline = "base",
    Bottom = "b"
}

export enum ST_LineCap {
    Flat = "flat",
    Round = "rnd",
    Square = "sq"
}

export enum ST_CompoundLine {
    Single = "sng",
    Double = "dbl",
    ThickThin = "thickThin",
    ThinThick = "thinThick",
    Triple = "tri"
}

export enum ST_PenAlignment {
    Center = "ctr",
    Inset = "in"
}

export enum ST_PresetLineDashVal {
    Solid = "solid",
    Dot = "dot",
    SystemDot = "sysDot",
    Dash = "dash",
    SystemDash = "sysDash",
    LongDash = "lgDash",
    DashDot = "dashDot",
    LongDashDot = "lgDashDot",
    LongDashDotDot = "lgDashDotDot",
    SystemDashDot = "sysDashDot",
    SystemDashDotDot = "sysDashDotDot"
}

/* eslint-enable @typescript-eslint/naming-convention */
