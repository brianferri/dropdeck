/* eslint-disable @typescript-eslint/naming-convention -- ST_ and CT_ names mirror the ECMA-376 SpreadsheetML schema verbatim. */

import type { HexRun, Repeat, UpperLetter } from "@dropdeck/common";
import type {
    Attr,
    AttrList,
    AttrScalar,
    AttrSeq,
    Element,
    Empty,
    Many,
    Node,
    One,
    Opt,
    OptAttr,
    ReqAttr,
    Seq,
    ST_Boolean,
    ST_Xstring,
    Text
} from "../oox.js";
import type {
    ST_BorderStyle,
    ST_CalcMode,
    ST_CellComments,
    ST_CellFormulaType,
    ST_CellType,
    ST_CfOperator,
    ST_CfType,
    ST_CfvoType,
    ST_DataValidationErrorStyle,
    ST_DataValidationOperator,
    ST_DataValidationType,
    ST_FilterOperator,
    ST_FontScheme,
    ST_GradientType,
    ST_HorizontalAlignment,
    ST_IconSetType,
    ST_Objects,
    ST_Orientation,
    ST_PageOrder,
    ST_Pane,
    ST_PaneState,
    ST_PatternType,
    ST_PrintError,
    ST_RefMode,
    ST_SheetState,
    ST_SheetViewType,
    ST_SortBy,
    ST_SortMethod,
    ST_TableType,
    ST_TimePeriod,
    ST_TotalsRowFunction,
    ST_UnderlineValues,
    ST_VerticalAlignment,
    ST_VerticalAlignRun,
    ST_Visibility
} from "../spreadsheetml/Specification.js";

// A tuple of optional [name, type] pairs becomes an array of the union of those attributes, not a union of every
// present/absent tuple: enumerating the tuples costs 2^n and overflows the compiler once an element carries a dozen
// optional attributes. Each attribute's name and type is still checked; only order and presence are left free.
type AttrOf<P> = P extends readonly [infer N extends string, infer V extends AttrScalar] ? Attr<N, V> : never;
type OptAttrs<T extends ReadonlyArray<readonly [string, AttrScalar]>> = ReadonlyArray<AttrOf<T[number]>>;

type Attrs<Req extends AttrList, Optional extends ReadonlyArray<readonly [string, AttrScalar]>> = AttrSeq<Req, OptAttrs<Optional>>;

// Bounding the column to two letters and the range to single-letter endpoints keeps the union from squaring past
// what the compiler will represent; the assembler asserts wider references back to these types at runtime.
type Column = UpperLetter | `${UpperLetter}${UpperLetter}`;
export type ST_CellRef = `${Column}${number}`;
export type ST_Ref = ST_CellRef | `${UpperLetter}${number}:${UpperLetter}${number}`;
export type ST_Sqref = ST_Ref | `${ST_Ref} ${string}`; // Space-separated `ST_Ref` list; the leading ref is validated (18.18.76).
export type ST_Index = number; // xsd:unsignedInt; a numeric index into a workbook table -- no string structure to constrain.

// `string extends S` holds only for the bare type, which stays the `string` attribute shape; a concrete literal
// falls through and is validated. Length must be walked per digit because a union of every 8-hex group would be
// 22^8 members and overflow the compiler, so a bare template type cannot pin it (18.18.34).
export type ST_Guid<S extends string = string> = string extends S
    ? string
    : S extends `{${infer A}-${infer B}-${infer C}-${infer D}-${infer E}}`
        ? [
            HexRun<A, Repeat<0, 8>>,
            HexRun<B, Repeat<0, 4>>,
            HexRun<C, Repeat<0, 4>>,
            HexRun<D, Repeat<0, 4>>,
            HexRun<E, Repeat<0, 12>>
        ] extends [true, true, true, true, true]
            ? S
            : `invalid GUID "${S}": groups must hold 8-4-4-4-12 hex digits`
        : `invalid GUID "${S}": expected the form {8-4-4-4-12 hex digits}`;

export type ST_String = ST_Xstring;

export type ColorAttrs = OptAttrs<[["auto", ST_Boolean], ["indexed", number], ["rgb", ST_String], ["theme", number], ["tint", number]]>;
export type CT_Color = Element<"color" | "fgColor" | "bgColor", ColorAttrs, Empty>;

export type FontRunProps = Many<
    | Element<"b" | "i" | "strike" | "condense" | "extend" | "outline" | "shadow", OptAttr<"val", ST_Boolean>, Empty>
    | Element<"u", OptAttr<"val", ST_UnderlineValues>, Empty>
    | Element<"vertAlign", ReqAttr<"val", ST_VerticalAlignRun>, Empty>
    | Element<"sz", ReqAttr<"val", number>, Empty>
    | Element<"color", ColorAttrs, Empty>
    | Element<"name" | "rFont", ReqAttr<"val", ST_Xstring>, Empty>
    | Element<"charset" | "family", ReqAttr<"val", number>, Empty>
    | Element<"scheme", ReqAttr<"val", ST_FontScheme>, Empty>
>;

export type CT_TextField = Element<"t", OptAttr<"xml:space", "preserve">, One<Text>>;
export type CT_RPrElt = Element<"rPr", Empty, FontRunProps>;
export type CT_RElt = Element<"r", Empty, Seq<Opt<CT_RPrElt>, One<CT_TextField>>>;
export type CT_PhoneticRun = Element<"rPh", readonly [Attr<"sb", number>, Attr<"eb", number>], One<CT_TextField>>;
export type CT_PhoneticPr = Element<"phoneticPr", Attrs<ReqAttr<"fontId", ST_Index>, [["type", ST_String], ["alignment", ST_String]]>, Empty>;
export type CT_Rst = Element<"is" | "si", Empty, Seq<Opt<CT_TextField>, Seq<Many<CT_RElt>, Seq<Many<CT_PhoneticRun>, Opt<CT_PhoneticPr>>>>>;
export type CT_Sst = Element<"sst", Attrs<ReqAttr<"xmlns", ST_String>, [["count", number], ["uniqueCount", number]]>, Many<CT_Rst>>;

export type CT_NumFmt = Element<"numFmt", readonly [Attr<"numFmtId", number>, Attr<"formatCode", ST_Xstring>], Empty>;
export type CT_NumFmts = Element<"numFmts", OptAttr<"count", number>, Many<CT_NumFmt>>;

export type CT_Font = Element<"font", Empty, FontRunProps>;
export type CT_Fonts = Element<"fonts", OptAttr<"count", number>, Many<CT_Font>>;

export type CT_GradientStop = Element<"stop", ReqAttr<"position", number>, One<CT_Color>>;
export type CT_GradientFill = Element<"gradientFill", OptAttrs<[["type", ST_GradientType], ["degree", number], ["left", number], ["right", number], ["top", number], ["bottom", number]]>, Many<CT_GradientStop>>;
export type CT_PatternFill = Element<"patternFill", OptAttr<"patternType", ST_PatternType>, Seq<Opt<CT_Color>, Opt<CT_Color>>>;
export type CT_Fill = Element<"fill", Empty, One<CT_PatternFill | CT_GradientFill>>;
export type CT_Fills = Element<"fills", OptAttr<"count", number>, Many<CT_Fill>>;

export type CT_BorderPr = Element<"left" | "right" | "top" | "bottom" | "diagonal" | "vertical" | "horizontal" | "start" | "end", OptAttr<"style", ST_BorderStyle>, Opt<CT_Color>>;
export type CT_Border = Element<"border", OptAttrs<[["diagonalUp", ST_Boolean], ["diagonalDown", ST_Boolean], ["outline", ST_Boolean]]>, Many<CT_BorderPr>>;
export type CT_Borders = Element<"borders", OptAttr<"count", number>, Many<CT_Border>>;

export type CT_CellAlignment = Element<
    "alignment",
    OptAttrs<[
        ["horizontal", ST_HorizontalAlignment], ["vertical", ST_VerticalAlignment], ["textRotation", number], ["wrapText", ST_Boolean],
        ["indent", number], ["relativeIndent", number], ["justifyLastLine", ST_Boolean], ["shrinkToFit", ST_Boolean], ["readingOrder", number]
    ]>,
    Empty
>;
export type CT_CellProtection = Element<"protection", OptAttrs<[["locked", ST_Boolean], ["hidden", ST_Boolean]]>, Empty>;
export type CT_Xf = Element<
    "xf",
    OptAttrs<[
        ["numFmtId", number], ["fontId", ST_Index], ["fillId", ST_Index], ["borderId", ST_Index], ["xfId", ST_Index],
        ["quotePrefix", ST_Boolean], ["pivotButton", ST_Boolean], ["applyNumberFormat", ST_Boolean], ["applyFont", ST_Boolean],
        ["applyFill", ST_Boolean], ["applyBorder", ST_Boolean], ["applyAlignment", ST_Boolean], ["applyProtection", ST_Boolean]
    ]>,
    Seq<Opt<CT_CellAlignment>, Opt<CT_CellProtection>>
>;
export type CT_CellXfs = Element<"cellXfs", OptAttr<"count", number>, Many<CT_Xf>>;
export type CT_CellStyleXfs = Element<"cellStyleXfs", OptAttr<"count", number>, Many<CT_Xf>>;
export type CT_CellStyle = Element<
    "cellStyle",
    Attrs<readonly [Attr<"name", ST_Xstring>, Attr<"xfId", ST_Index>], [["builtinId", number], ["iLevel", number], ["hidden", ST_Boolean], ["customBuiltin", ST_Boolean]]>,
    Empty
>;
export type CT_CellStyles = Element<"cellStyles", OptAttr<"count", number>, Many<CT_CellStyle>>;

// A differential format (used by conditional formatting and table styles) carries only the properties it overrides.
export type CT_Dxf = Element<
    "dxf",
    Empty,
    Seq<Opt<CT_Font>, Seq<Opt<Element<"numFmt", OptAttrs<[["numFmtId", number], ["formatCode", ST_Xstring]]>, Empty>>,
        Seq<Opt<CT_Fill>, Seq<Opt<CT_CellAlignment>, Seq<Opt<CT_Border>, Opt<CT_CellProtection>>>>>>
>;
export type CT_Dxfs = Element<"dxfs", OptAttr<"count", number>, Many<CT_Dxf>>;

export type CT_TableStyleElement = Element<"tableStyleElement", Attrs<ReqAttr<"type", ST_String>, [["size", number], ["dxfId", ST_Index]]>, Empty>;
export type CT_TableStyle = Element<"tableStyle", Attrs<ReqAttr<"name", ST_Xstring>, [["pivot", ST_Boolean], ["table", ST_Boolean], ["count", number]]>, Many<CT_TableStyleElement>>;
export type CT_TableStyles = Element<"tableStyles", OptAttrs<[["count", number], ["defaultTableStyle", ST_Xstring], ["defaultPivotStyle", ST_Xstring]]>, Many<CT_TableStyle>>;

export type CT_RgbColor = Element<"rgbColor", OptAttr<"rgb", ST_String>, Empty>;
export type CT_Colors = Element<"colors", Empty, Seq<Opt<Element<"indexedColors", Empty, Many<CT_RgbColor>>>, Opt<Element<"mruColors", Empty, Many<CT_RgbColor>>>>>;

export type CT_Stylesheet = Element<
    "styleSheet",
    ReqAttr<"xmlns", ST_String>,
    Seq<Opt<CT_NumFmts>, Seq<One<CT_Fonts>, Seq<One<CT_Fills>, Seq<One<CT_Borders>, Seq<Opt<CT_CellStyleXfs>,
        Seq<One<CT_CellXfs>, Seq<Opt<CT_CellStyles>, Seq<Opt<CT_Dxfs>, Seq<Opt<CT_TableStyles>, Opt<CT_Colors>>>>>>>>>>
>;

export type CT_Sheet = Element<"sheet", Attrs<readonly [Attr<"name", ST_Xstring>, Attr<"sheetId", number>, Attr<"r:id", ST_String>], [["state", ST_SheetState]]>, Empty>;
export type CT_Sheets = Element<"sheets", Empty, Many<CT_Sheet>>;
export type CT_WorkbookView = Element<
    "workbookView",
    OptAttrs<[
        ["visibility", ST_Visibility], ["minimized", ST_Boolean], ["showHorizontalScroll", ST_Boolean], ["showVerticalScroll", ST_Boolean],
        ["showSheetTabs", ST_Boolean], ["xWindow", number], ["yWindow", number], ["windowWidth", number], ["windowHeight", number],
        ["tabRatio", number], ["firstSheet", number], ["activeTab", number]
    ]>,
    Empty
>;
export type CT_BookViews = Element<"bookViews", Empty, Many<CT_WorkbookView>>;
export type CT_DefinedName = Element<
    "definedName",
    Attrs<ReqAttr<"name", ST_Xstring>, [["localSheetId", number], ["hidden", ST_Boolean], ["comment", ST_Xstring], ["function", ST_Boolean], ["functionGroupId", number]]>,
    One<Text>
>;
export type CT_DefinedNames = Element<"definedNames", Empty, Many<CT_DefinedName>>;
export type CT_CalcPr = Element<
    "calcPr",
    OptAttrs<[
        ["calcId", number], ["calcMode", ST_CalcMode], ["fullCalcOnLoad", ST_Boolean], ["refMode", ST_RefMode], ["iterate", ST_Boolean],
        ["iterateCount", number], ["iterateDelta", number], ["fullPrecision", ST_Boolean], ["calcCompleted", ST_Boolean], ["calcOnSave", ST_Boolean],
        ["concurrentCalc", ST_Boolean], ["concurrentManualCount", number]
    ]>,
    Empty
>;
export type CT_WorkbookPr = Element<
    "workbookPr",
    OptAttrs<[
        ["date1904", ST_Boolean], ["showObjects", ST_Objects], ["showBorderUnselectedTables", ST_Boolean], ["filterPrivacy", ST_Boolean],
        ["promptedSolutions", ST_Boolean], ["showInkAnnotation", ST_Boolean], ["backupFile", ST_Boolean], ["saveExternalLinkValues", ST_Boolean],
        ["defaultThemeVersion", number], ["codeName", ST_String]
    ]>,
    Empty
>;
export type CT_FileVersion = Element<"fileVersion", OptAttrs<[["appName", ST_String], ["lastEdited", ST_String], ["lowestEdited", ST_String], ["rupBuild", ST_String], ["codeName", ST_Guid]]>, Empty>;
export type CT_WorkbookProtection = Element<
    "workbookProtection",
    OptAttrs<[["workbookPassword", ST_String], ["revisionsPassword", ST_String], ["lockStructure", ST_Boolean], ["lockWindows", ST_Boolean], ["lockRevision", ST_Boolean]]>,
    Empty
>;
export type CT_PivotCache = Element<"pivotCache", readonly [Attr<"cacheId", number>, Attr<"r:id", ST_String>], Empty>;
export type CT_PivotCaches = Element<"pivotCaches", Empty, Many<CT_PivotCache>>;
export type CT_ExternalReference = Element<"externalReference", ReqAttr<"r:id", ST_String>, Empty>;
export type CT_ExternalReferences = Element<"externalReferences", Empty, Many<CT_ExternalReference>>;

export type CT_Workbook = Element<
    "workbook",
    readonly [Attr<"xmlns", ST_String>, Attr<"xmlns:r", ST_String>],
    Seq<Opt<CT_FileVersion>, Seq<Opt<CT_WorkbookPr>, Seq<Opt<CT_WorkbookProtection>, Seq<Opt<CT_BookViews>,
        Seq<One<CT_Sheets>, Seq<Opt<CT_ExternalReferences>, Seq<Opt<CT_DefinedNames>, Seq<Opt<CT_CalcPr>, Opt<CT_PivotCaches>>>>>>>>>
>;

export type CT_CellFormula = Element<"f", OptAttrs<[["t", ST_CellFormulaType], ["ref", ST_Ref], ["si", number], ["aca", ST_Boolean], ["dt2D", ST_Boolean], ["dtr", ST_Boolean], ["ca", ST_Boolean]]>, One<Text>>;
export type CT_Cell = Element<
    "c",
    Attrs<ReqAttr<"r", ST_CellRef>, [["s", ST_Index], ["t", ST_CellType], ["cm", number], ["vm", number], ["ph", ST_Boolean]]>,
    Seq<Opt<CT_CellFormula>, Seq<Opt<Element<"v", Empty, One<Text>>>, Opt<CT_Rst>>>
>;
export type CT_Row = Element<
    "row",
    OptAttrs<[
        ["r", number], ["spans", ST_String], ["s", ST_Index], ["customFormat", ST_Boolean], ["ht", number], ["hidden", ST_Boolean],
        ["customHeight", ST_Boolean], ["outlineLevel", number], ["collapsed", ST_Boolean], ["thickTop", ST_Boolean], ["thickBot", ST_Boolean], ["ph", ST_Boolean]
    ]>,
    Many<CT_Cell>
>;
export type CT_SheetData = Element<"sheetData", Empty, Many<CT_Row>>;

export type CT_SheetDimension = Element<"dimension", ReqAttr<"ref", ST_Ref>, Empty>;
export type CT_Pane = Element<"pane", OptAttrs<[["xSplit", number], ["ySplit", number], ["topLeftCell", ST_CellRef], ["activePane", ST_Pane], ["state", ST_PaneState]]>, Empty>;
export type CT_Selection = Element<"selection", OptAttrs<[["pane", ST_Pane], ["activeCell", ST_CellRef], ["activeCellId", number], ["sqref", ST_Sqref]]>, Empty>;
export type CT_SheetView = Element<
    "sheetView",
    Attrs<ReqAttr<"workbookViewId", number>, [
        ["windowProtection", ST_Boolean], ["showFormulas", ST_Boolean], ["showGridLines", ST_Boolean], ["showRowColHeaders", ST_Boolean],
        ["showZeros", ST_Boolean], ["rightToLeft", ST_Boolean], ["tabSelected", ST_Boolean], ["showRuler", ST_Boolean], ["showOutlineSymbols", ST_Boolean],
        ["defaultGridColor", ST_Boolean], ["view", ST_SheetViewType], ["topLeftCell", ST_CellRef], ["colorId", number], ["zoomScale", number], ["zoomScaleNormal", number]
    ]>,
    Seq<Opt<CT_Pane>, Many<CT_Selection>>
>;
export type CT_SheetViews = Element<"sheetViews", Empty, Many<CT_SheetView>>;

export type CT_SheetFormatPr = Element<
    "sheetFormatPr",
    OptAttrs<[
        ["baseColWidth", number], ["defaultColWidth", number], ["defaultRowHeight", number], ["customHeight", ST_Boolean], ["zeroHeight", ST_Boolean],
        ["thickTop", ST_Boolean], ["thickBottom", ST_Boolean], ["outlineLevelRow", number], ["outlineLevelCol", number]
    ]>,
    Empty
>;
export type CT_Col = Element<
    "col",
    Attrs<readonly [Attr<"min", number>, Attr<"max", number>], [
        ["width", number], ["style", ST_Index], ["hidden", ST_Boolean], ["bestFit", ST_Boolean],
        ["customWidth", ST_Boolean], ["phonetic", ST_Boolean], ["outlineLevel", number], ["collapsed", ST_Boolean]
    ]>,
    Empty
>;
export type CT_Cols = Element<"cols", Empty, Many<CT_Col>>;

export type CT_SheetPr = Element<
    "sheetPr",
    OptAttrs<[
        ["syncHorizontal", ST_Boolean], ["syncVertical", ST_Boolean], ["syncRef", ST_Ref], ["transitionEvaluation", ST_Boolean], ["transitionEntry", ST_Boolean],
        ["published", ST_Boolean], ["codeName", ST_String], ["filterMode", ST_Boolean], ["enableFormatConditionsCalculation", ST_Boolean]
    ]>,
    Seq<Opt<Element<"tabColor", ColorAttrs, Empty>>, Opt<Element<"pageSetUpPr", OptAttrs<[["autoPageBreaks", ST_Boolean], ["fitToPage", ST_Boolean]]>, Empty>>>
>;
export type CT_MergeCell = Element<"mergeCell", ReqAttr<"ref", ST_Ref>, Empty>;
export type CT_MergeCells = Element<"mergeCells", OptAttr<"count", number>, Many<CT_MergeCell>>;
export type CT_Hyperlink = Element<"hyperlink", Attrs<ReqAttr<"ref", ST_Ref>, [["r:id", ST_String], ["location", ST_Xstring], ["tooltip", ST_Xstring], ["display", ST_Xstring]]>, Empty>;
export type CT_Hyperlinks = Element<"hyperlinks", Empty, Many<CT_Hyperlink>>;

export type CT_DataValidation = Element<
    "dataValidation",
    OptAttrs<[
        ["type", ST_DataValidationType], ["errorStyle", ST_DataValidationErrorStyle], ["operator", ST_DataValidationOperator], ["allowBlank", ST_Boolean],
        ["showDropDown", ST_Boolean], ["showInputMessage", ST_Boolean], ["showErrorMessage", ST_Boolean], ["errorTitle", ST_Xstring], ["error", ST_Xstring],
        ["promptTitle", ST_Xstring], ["prompt", ST_Xstring], ["sqref", ST_Sqref]
    ]>,
    Seq<Opt<Element<"formula1", Empty, One<Text>>>, Opt<Element<"formula2", Empty, One<Text>>>>
>;
export type CT_DataValidations = Element<"dataValidations", OptAttrs<[["disablePrompts", ST_Boolean], ["xWindow", number], ["yWindow", number], ["count", number]]>, Many<CT_DataValidation>>;

export type CT_Cfvo = Element<"cfvo", Attrs<ReqAttr<"type", ST_CfvoType>, [["val", ST_Xstring], ["gte", ST_Boolean]]>, Empty>;
export type CT_ColorScale = Element<"colorScale", Empty, Seq<Many<CT_Cfvo>, Many<CT_Color>>>;
export type CT_DataBar = Element<"dataBar", OptAttrs<[["minLength", number], ["maxLength", number], ["showValue", ST_Boolean]]>, Seq<Many<CT_Cfvo>, One<CT_Color>>>;
export type CT_IconSet = Element<"iconSet", OptAttrs<[["iconSet", ST_IconSetType], ["showValue", ST_Boolean], ["percent", ST_Boolean], ["reverse", ST_Boolean]]>, Many<CT_Cfvo>>;
export type CT_CfRule = Element<
    "cfRule",
    Attrs<ReqAttr<"type", ST_CfType>, [
        ["dxfId", ST_Index], ["priority", number], ["stopIfTrue", ST_Boolean], ["aboveAverage", ST_Boolean], ["percent", ST_Boolean], ["bottom", ST_Boolean],
        ["operator", ST_CfOperator], ["text", ST_Xstring], ["timePeriod", ST_TimePeriod], ["rank", number], ["stdDev", number], ["equalAverage", ST_Boolean]
    ]>,
    Seq<Many<Element<"formula", Empty, One<Text>>>, Seq<Opt<CT_ColorScale>, Seq<Opt<CT_DataBar>, Opt<CT_IconSet>>>>
>;
export type CT_ConditionalFormatting = Element<"conditionalFormatting", Attrs<ReqAttr<"sqref", ST_Sqref>, [["pivot", ST_Boolean]]>, Many<CT_CfRule>>;

export type CT_FilterCriteria = Element<"filter", ReqAttr<"val", ST_Xstring>, Empty>;
export type CT_CustomFilter = Element<"customFilter", OptAttrs<[["operator", ST_FilterOperator], ["val", ST_Xstring]]>, Empty>;
export type CT_FilterColumn = Element<
    "filterColumn",
    Attrs<ReqAttr<"colId", number>, [["hiddenButton", ST_Boolean], ["showButton", ST_Boolean]]>,
    Seq<Opt<Element<"filters", OptAttrs<[["blank", ST_Boolean]]>, Many<CT_FilterCriteria>>>, Opt<Element<"customFilters", OptAttrs<[["and", ST_Boolean]]>, Many<CT_CustomFilter>>>>
>;
export type CT_SortCondition = Element<
    "sortCondition",
    Attrs<ReqAttr<"ref", ST_Ref>, [["descending", ST_Boolean], ["sortBy", ST_SortBy], ["customList", ST_Xstring], ["dxfId", ST_Index], ["iconSet", ST_IconSetType], ["iconId", number]]>,
    Empty
>;
export type CT_SortState = Element<"sortState", Attrs<ReqAttr<"ref", ST_Ref>, [["columnSort", ST_Boolean], ["caseSensitive", ST_Boolean], ["sortMethod", ST_SortMethod]]>, Many<CT_SortCondition>>;
export type CT_AutoFilter = Element<"autoFilter", OptAttr<"ref", ST_Ref>, Seq<Many<CT_FilterColumn>, Opt<CT_SortState>>>;

export type CT_PageMargins = Element<"pageMargins", readonly [Attr<"left", number>, Attr<"right", number>, Attr<"top", number>, Attr<"bottom", number>, Attr<"header", number>, Attr<"footer", number>], Empty>;
export type CT_PageSetup = Element<
    "pageSetup",
    OptAttrs<[
        ["paperSize", number], ["scale", number], ["firstPageNumber", number], ["fitToWidth", number], ["fitToHeight", number], ["pageOrder", ST_PageOrder],
        ["orientation", ST_Orientation], ["usePrinterDefaults", ST_Boolean], ["blackAndWhite", ST_Boolean], ["draft", ST_Boolean], ["cellComments", ST_CellComments],
        ["useFirstPageNumber", ST_Boolean], ["errors", ST_PrintError], ["horizontalDpi", number], ["verticalDpi", number], ["copies", number], ["r:id", ST_String]
    ]>,
    Empty
>;
export type CT_PrintOptions = Element<
    "printOptions",
    OptAttrs<[["horizontalCentered", ST_Boolean], ["verticalCentered", ST_Boolean], ["headings", ST_Boolean], ["gridLines", ST_Boolean], ["gridLinesSet", ST_Boolean]]>,
    Empty
>;
export type CT_HeaderFooter = Element<
    "headerFooter",
    OptAttrs<[["differentOddEven", ST_Boolean], ["differentFirst", ST_Boolean], ["scaleWithDoc", ST_Boolean], ["alignWithMargins", ST_Boolean]]>,
    Seq<Opt<Element<"oddHeader", Empty, One<Text>>>, Seq<Opt<Element<"oddFooter", Empty, One<Text>>>, Seq<Opt<Element<"evenHeader", Empty, One<Text>>>,
        Seq<Opt<Element<"evenFooter", Empty, One<Text>>>, Seq<Opt<Element<"firstHeader", Empty, One<Text>>>, Opt<Element<"firstFooter", Empty, One<Text>>>>>>>>
>;
export type CT_Break = Element<"brk", OptAttrs<[["id", number], ["min", number], ["max", number], ["man", ST_Boolean], ["pt", ST_Boolean]]>, Empty>;
export type CT_PageBreak = Element<"rowBreaks" | "colBreaks", OptAttrs<[["count", number], ["manualBreakCount", number]]>, Many<CT_Break>>;
export type CT_SheetProtection = Element<
    "sheetProtection",
    OptAttrs<[
        ["password", ST_String], ["algorithmName", ST_String], ["hashValue", ST_String], ["saltValue", ST_String], ["spinCount", number], ["sheet", ST_Boolean],
        ["objects", ST_Boolean], ["scenarios", ST_Boolean], ["formatCells", ST_Boolean], ["formatColumns", ST_Boolean], ["formatRows", ST_Boolean], ["insertColumns", ST_Boolean],
        ["insertRows", ST_Boolean], ["insertHyperlinks", ST_Boolean], ["deleteColumns", ST_Boolean], ["deleteRows", ST_Boolean], ["selectLockedCells", ST_Boolean], ["sort", ST_Boolean],
        ["autoFilter", ST_Boolean], ["pivotTables", ST_Boolean], ["selectUnlockedCells", ST_Boolean]
    ]>,
    Empty
>;
export type CT_TablePart = Element<"tablePart", ReqAttr<"r:id", ST_String>, Empty>;
export type CT_TableParts = Element<"tableParts", OptAttr<"count", number>, Many<CT_TablePart>>;
export type CT_Drawing = Element<"drawing", ReqAttr<"r:id", ST_String>, Empty>;

export type CT_Worksheet = Element<
    "worksheet",
    readonly [Attr<"xmlns", ST_String>, Attr<"xmlns:r", ST_String>],
    Seq<Opt<CT_SheetPr>, Seq<Opt<CT_SheetDimension>, Seq<Opt<CT_SheetViews>, Seq<Opt<CT_SheetFormatPr>, Seq<Opt<CT_Cols>, Seq<One<CT_SheetData>, Many<Node>>>>>>>
>;

export type CT_TableColumn = Element<
    "tableColumn",
    Attrs<readonly [Attr<"id", number>, Attr<"name", ST_Xstring>], [
        ["totalsRowFunction", ST_TotalsRowFunction], ["totalsRowLabel", ST_Xstring], ["queryTableFieldId", number],
        ["dataDxfId", ST_Index], ["headerRowDxfId", ST_Index], ["totalsRowDxfId", ST_Index]
    ]>,
    Seq<Opt<Element<"calculatedColumnFormula", OptAttr<"array", ST_Boolean>, One<Text>>>, Opt<Element<"totalsRowFormula", OptAttr<"array", ST_Boolean>, One<Text>>>>
>;
export type CT_TableColumns = Element<"tableColumns", ReqAttr<"count", number>, Many<CT_TableColumn>>;
export type CT_TableStyleInfo = Element<
    "tableStyleInfo",
    OptAttrs<[["name", ST_Xstring], ["showFirstColumn", ST_Boolean], ["showLastColumn", ST_Boolean], ["showRowStripes", ST_Boolean], ["showColumnStripes", ST_Boolean]]>,
    Empty
>;
export type CT_Table = Element<
    "table",
    Attrs<readonly [Attr<"xmlns", ST_String>, Attr<"id", number>, Attr<"name", ST_Xstring>, Attr<"displayName", ST_Xstring>, Attr<"ref", ST_Ref>], [
        ["tableType", ST_TableType], ["headerRowCount", number], ["totalsRowCount", number], ["totalsRowShown", ST_Boolean],
        ["headerRowDxfId", ST_Index], ["dataDxfId", ST_Index], ["totalsRowDxfId", ST_Index]
    ]>,
    Seq<Opt<CT_AutoFilter>, Seq<Opt<CT_SortState>, Seq<One<CT_TableColumns>, Opt<CT_TableStyleInfo>>>>
>;

export type CT_Author = Element<"author", Empty, One<Text>>;
export type CT_Comment = Element<"comment", Attrs<ReqAttr<"ref", ST_Ref>, [["authorId", number], ["guid", ST_Guid], ["shapeId", number]]>, One<CT_Rst>>;
export type CT_Comments = Element<"comments", ReqAttr<"xmlns", ST_String>, Seq<One<Element<"authors", Empty, Many<CT_Author>>>, One<Element<"commentList", Empty, Many<CT_Comment>>>>>;

export type CT_CalcCell = Element<"c", Attrs<ReqAttr<"r", ST_CellRef>, [["i", number], ["s", ST_Boolean], ["l", ST_Boolean], ["t", ST_Boolean], ["a", ST_Boolean]]>, Empty>;
export type CT_CalcChain = Element<"calcChain", ReqAttr<"xmlns", ST_String>, Many<CT_CalcCell>>;

export type StyleSheetParts = {
    readonly fonts: ReadonlyArray<CT_Font>,
    readonly fills: ReadonlyArray<CT_Fill>,
    readonly borders: ReadonlyArray<CT_Border>,
    readonly cellStyleXfs: ReadonlyArray<CT_Xf>,
    readonly cellXfs: ReadonlyArray<CT_Xf>,
    readonly cellStyles: ReadonlyArray<CT_CellStyle>
};

/* eslint-enable @typescript-eslint/naming-convention */
