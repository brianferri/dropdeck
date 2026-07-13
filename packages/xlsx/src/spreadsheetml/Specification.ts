/* eslint-disable @typescript-eslint/naming-convention -- ST_ and CT_ names mirror the ECMA-376 SpreadsheetML schema verbatim. */

export enum ST_CellType {
    Boolean = "b", Number = "n", Error = "e", SharedString = "s", String = "str", InlineString = "inlineStr", Date = "d"
}
export enum ST_CellFormulaType { Normal = "normal", Array = "array", DataTable = "dataTable", Shared = "shared" }
export enum ST_SheetState { Visible = "visible", Hidden = "hidden", VeryHidden = "veryHidden" }
export enum ST_Pane { BottomRight = "bottomRight", TopRight = "topRight", BottomLeft = "bottomLeft", TopLeft = "topLeft" }
export enum ST_PaneState { Split = "split", Frozen = "frozen", FrozenSplit = "frozenSplit" }
export enum ST_SheetViewType { Normal = "normal", PageBreakPreview = "pageBreakPreview", PageLayout = "pageLayout" }
export enum ST_PatternType {
    None = "none", Solid = "solid", MediumGray = "mediumGray", DarkGray = "darkGray", LightGray = "lightGray",
    Gray125 = "gray125", Gray0625 = "gray0625", DarkHorizontal = "darkHorizontal", DarkVertical = "darkVertical",
    DarkDown = "darkDown", DarkUp = "darkUp", DarkGrid = "darkGrid", DarkTrellis = "darkTrellis",
    LightHorizontal = "lightHorizontal", LightVertical = "lightVertical", LightDown = "lightDown", LightUp = "lightUp",
    LightGrid = "lightGrid", LightTrellis = "lightTrellis"
}
export enum ST_GradientType { Linear = "linear", Path = "path" }
export enum ST_BorderStyle {
    None = "none", Thin = "thin", Medium = "medium", Dashed = "dashed", Dotted = "dotted", Thick = "thick",
    Double = "double", Hair = "hair", MediumDashed = "mediumDashed", DashDot = "dashDot", MediumDashDot = "mediumDashDot",
    DashDotDot = "dashDotDot", MediumDashDotDot = "mediumDashDotDot", SlantDashDot = "slantDashDot"
}
export enum ST_HorizontalAlignment {
    General = "general", Left = "left", Center = "center", Right = "right", Fill = "fill",
    Justify = "justify", CenterContinuous = "centerContinuous", Distributed = "distributed"
}
export enum ST_VerticalAlignment { Top = "top", Center = "center", Bottom = "bottom", Justify = "justify", Distributed = "distributed" }
export enum ST_UnderlineValues { Single = "single", Double = "double", SingleAccounting = "singleAccounting", DoubleAccounting = "doubleAccounting", None = "none" }
export enum ST_FontScheme { None = "none", Major = "major", Minor = "minor" }
export enum ST_VerticalAlignRun { Baseline = "baseline", Superscript = "superscript", Subscript = "subscript" }
export enum ST_DataValidationType { None = "none", Whole = "whole", Decimal = "decimal", List = "list", Date = "date", Time = "time", TextLength = "textLength", Custom = "custom" }
export enum ST_DataValidationOperator {
    Between = "between", NotBetween = "notBetween", Equal = "equal", NotEqual = "notEqual",
    LessThan = "lessThan", LessThanOrEqual = "lessThanOrEqual", GreaterThan = "greaterThan", GreaterThanOrEqual = "greaterThanOrEqual"
}
export enum ST_DataValidationErrorStyle { Stop = "stop", Warning = "warning", Information = "information" }
export enum ST_CfType {
    Expression = "expression", CellIs = "cellIs", ColorScale = "colorScale", DataBar = "dataBar", IconSet = "iconSet",
    Top10 = "top10", UniqueValues = "uniqueValues", DuplicateValues = "duplicateValues", ContainsText = "containsText",
    NotContainsText = "notContainsText", BeginsWith = "beginsWith", EndsWith = "endsWith", ContainsBlanks = "containsBlanks",
    NotContainsBlanks = "notContainsBlanks", ContainsErrors = "containsErrors", NotContainsErrors = "notContainsErrors",
    TimePeriod = "timePeriod", AboveAverage = "aboveAverage"
}
export enum ST_CfOperator {
    LessThan = "lessThan", LessThanOrEqual = "lessThanOrEqual", Equal = "equal", NotEqual = "notEqual",
    GreaterThanOrEqual = "greaterThanOrEqual", GreaterThan = "greaterThan", Between = "between", NotBetween = "notBetween",
    ContainsText = "containsText", NotContains = "notContains", BeginsWith = "beginsWith", EndsWith = "endsWith"
}
export enum ST_CfvoType { Num = "num", Percent = "percent", Max = "max", Min = "min", Formula = "formula", Percentile = "percentile" }
export enum ST_IconSetType {
    ThreeArrows = "3Arrows", ThreeArrowsGray = "3ArrowsGray", ThreeFlags = "3Flags", ThreeTrafficLights1 = "3TrafficLights1",
    ThreeTrafficLights2 = "3TrafficLights2", ThreeSigns = "3Signs", ThreeSymbols = "3Symbols", ThreeSymbols2 = "3Symbols2",
    FourArrows = "4Arrows", FourArrowsGray = "4ArrowsGray", FourRedToBlack = "4RedToBlack", FourRating = "4Rating",
    FourTrafficLights = "4TrafficLights", FiveArrows = "5Arrows", FiveArrowsGray = "5ArrowsGray", FiveRating = "5Rating", FiveQuarters = "5Quarters"
}
export enum ST_TimePeriod {
    Today = "today", Yesterday = "yesterday", Tomorrow = "tomorrow", Last7Days = "last7Days", ThisMonth = "thisMonth",
    LastMonth = "lastMonth", NextMonth = "nextMonth", ThisWeek = "thisWeek", LastWeek = "lastWeek", NextWeek = "nextWeek"
}
export enum ST_Orientation { Default = "default", Portrait = "portrait", Landscape = "landscape" }
export enum ST_PageOrder { DownThenOver = "downThenOver", OverThenDown = "overThenDown" }
export enum ST_CellComments { None = "none", AsDisplayed = "asDisplayed", AtEnd = "atEnd" }
export enum ST_PrintError { Displayed = "displayed", Blank = "blank", Dash = "dash", NA = "NA" }
export enum ST_TableType { Worksheet = "worksheet", Xml = "xml", QueryTable = "queryTable" }
export enum ST_TotalsRowFunction { None = "none", Sum = "sum", Min = "min", Max = "max", Average = "average", Count = "count", CountNums = "countNums", StdDev = "stdDev", Var = "var", Custom = "custom" }
export enum ST_CalcMode { Manual = "manual", Auto = "auto", AutoNoTable = "autoNoTable" }
export enum ST_RefMode { A1 = "A1", R1C1 = "R1C1" }
export enum ST_Visibility { Visible = "visible", Hidden = "hidden", VeryHidden = "veryHidden" }
export enum ST_Objects { All = "all", Placeholders = "placeholders", None = "none" }
export enum ST_FilterOperator { Equal = "equal", LessThan = "lessThan", LessThanOrEqual = "lessThanOrEqual", NotEqual = "notEqual", GreaterThanOrEqual = "greaterThanOrEqual", GreaterThan = "greaterThan" }
export enum ST_SortMethod { Stroke = "stroke", PinYin = "pinYin", None = "none" }
export enum ST_SortBy { Value = "value", CellColor = "cellColor", FontColor = "fontColor", Icon = "icon" }
export enum ST_DvAspect { DVASPECT_CONTENT = "DVASPECT_CONTENT", DVASPECT_ICON = "DVASPECT_ICON" }

export type {
    ST_CellRef, ST_Ref, ST_Sqref, ST_Index, ST_Guid, ST_String,
    ColorAttrs, CT_Color, FontRunProps, CT_TextField, CT_RPrElt, CT_RElt, CT_PhoneticRun, CT_PhoneticPr, CT_Rst, CT_Sst,
    CT_NumFmt, CT_NumFmts, CT_Font, CT_Fonts, CT_GradientStop, CT_GradientFill, CT_PatternFill, CT_Fill, CT_Fills,
    CT_BorderPr, CT_Border, CT_Borders, CT_CellAlignment, CT_CellProtection, CT_Xf, CT_CellXfs, CT_CellStyleXfs,
    CT_CellStyle, CT_CellStyles, CT_Dxf, CT_Dxfs, CT_TableStyleElement, CT_TableStyle, CT_TableStyles, CT_RgbColor,
    CT_Colors, CT_Stylesheet, CT_Sheet, CT_Sheets, CT_WorkbookView, CT_BookViews, CT_DefinedName, CT_DefinedNames,
    CT_CalcPr, CT_WorkbookPr, CT_FileVersion, CT_WorkbookProtection, CT_PivotCache, CT_PivotCaches, CT_ExternalReference,
    CT_ExternalReferences, CT_Workbook, CT_CellFormula, CT_Cell, CT_Row, CT_SheetData, CT_SheetDimension, CT_Pane,
    CT_Selection, CT_SheetView, CT_SheetViews, CT_SheetFormatPr, CT_Col, CT_Cols, CT_SheetPr, CT_MergeCell, CT_MergeCells,
    CT_Hyperlink, CT_Hyperlinks, CT_DataValidation, CT_DataValidations, CT_Cfvo, CT_ColorScale, CT_DataBar, CT_IconSet,
    CT_CfRule, CT_ConditionalFormatting, CT_FilterCriteria, CT_CustomFilter, CT_FilterColumn, CT_SortCondition,
    CT_SortState, CT_AutoFilter, CT_PageMargins, CT_PageSetup, CT_PrintOptions, CT_HeaderFooter, CT_Break, CT_PageBreak,
    CT_SheetProtection, CT_TablePart, CT_TableParts, CT_Drawing, CT_Worksheet, CT_TableColumn, CT_TableColumns,
    CT_TableStyleInfo, CT_Table, CT_Author, CT_Comment, CT_Comments, CT_CalcCell, CT_CalcChain, StyleSheetParts
} from "../typings/spreadsheetml.js";

/* eslint-enable @typescript-eslint/naming-convention */
