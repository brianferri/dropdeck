/* eslint-disable @typescript-eslint/naming-convention -- ST_*\/CT_* mirror the ECMA-376 schema names verbatim. */

import type { HexDigit } from "@dropdeck/common";
import type {
    Attr,
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
    Text
} from "@dropdeck/xml";
import type { ST_Boolean } from "@dropdeck/oox";
import type { QName } from "@dropdeck/oox";
import type {
    ST_LineCap,
    ST_CompoundLine,
    ST_PenAlignment,
    ST_PresetLineDashVal,
    ST_TextAlignType,
    ST_TextAnchoringType,
    ST_TextCapsType,
    ST_TextFontAlignType,
    ST_TextHorzOverflowType,
    ST_TextStrikeType,
    ST_TextUnderlineType,
    ST_TextVerticalType,
    ST_TextVertOverflowType,
    ST_TextWrappingType
} from "../drawingml/Specification.js";

// EMU (English Metric Unit): 914400 per inch, 12700 per point. https://ooxml.info/docs/20/20.1/20.1.2/20.1.2.1/
export type ST_Coordinate = number; // A signed length in EMU.
export type ST_PositiveCoordinate = number; // A non-negative length in EMU.
export type ST_Coordinate32 = number; // A signed 32-bit length in EMU.
export type ST_PositiveCoordinate32 = number; // A non-negative 32-bit length in EMU.
export type ST_Angle = number; // An angle in 1/60000 of a degree.
export type ST_DrawingElementId = number; // xsd:unsignedInt; unique within a slide.
export type ST_HexColorRGB = string; // Validate a literal with `ValidateHexColor`.
export type ST_TextFontSize = number; // Font size in hundredths of a point, 100..400000.
export type ST_TextPoint = number; // A signed length in hundredths of a point.
export type ST_TextNonNegativePoint = number; // A non-negative length in hundredths of a point.
export type ST_TextMargin = number; // A paragraph margin in EMU, 0..51206400.
export type ST_TextIndent = number; // A first-line indent in EMU, -51206400..51206400.
export type ST_TextIndentLevelType = number; // A list indent level, 0..8.
export type ST_TextColumnCount = number; // A text-frame column count, 1..16.
export type ST_Percentage = number; // A percentage in thousandths of a percent.

export type ST_TextLanguageID = `${string}-${string}`;

export type ST_ShapeType =
    | "line" | "rect" | "roundRect" | "round1Rect" | "round2SameRect" | "round2DiagRect"
    | "snipRoundRect" | "snip1Rect" | "snip2SameRect" | "snip2DiagRect" | "plaque" | "frame"
    | "ellipse" | "triangle" | "rtTriangle" | "diamond" | "parallelogram" | "trapezoid"
    | "pentagon" | "hexagon" | "heptagon" | "octagon" | "decagon" | "dodecagon"
    | "star4" | "star5" | "star6" | "star8" | "star10" | "star12"
    | "rightArrow" | "leftArrow" | "upArrow" | "downArrow" | "leftRightArrow" | "chevron"
    | "pie" | "blockArc" | "donut" | "noSmoking" | "heart" | "lightningBolt"
    | "sun" | "moon" | "cloud" | "can" | "cube" | "smileyFace";

// Six single-character `infer`s reject a shorter string (outer match fails) and a longer one (the trailing `F` is
// multi-character, so not a `HexDigit`), pinning the length to exactly 6.
export type ValidateHexColor<S extends string> = S extends `${infer A}${infer B}${infer C}${infer D}${infer E}${infer F}`
    ? [A, B, C, D, E, F] extends [HexDigit, HexDigit, HexDigit, HexDigit, HexDigit, HexDigit]
        ? S
        : `invalid hex colour "${S}": each of 6 characters must be a hex digit`
    : `invalid hex colour "${S}": expected exactly 6 hex digits`;

export type CT_Point2D = Element<
    QName<"a", "off">,
    readonly [Attr<"x", ST_Coordinate>, Attr<"y", ST_Coordinate>],
    Empty
>;

export type CT_PositiveSize2D = Element<
    QName<"a", "ext">,
    readonly [Attr<"cx", ST_PositiveCoordinate>, Attr<"cy", ST_PositiveCoordinate>],
    Empty
>;

export type CT_Transform2D = Element<
    QName<"a", "xfrm">,
    AttrSeq<OptAttr<"rot", ST_Angle>, AttrSeq<OptAttr<"flipH", ST_Boolean>, OptAttr<"flipV", ST_Boolean>>>,
    Seq<Opt<CT_Point2D>, Opt<CT_PositiveSize2D>>
>;

export type CT_ChildOffset2D = Element<QName<"a", "chOff">, readonly [Attr<"x", ST_Coordinate>, Attr<"y", ST_Coordinate>], Empty>;
export type CT_ChildSize2D = Element<QName<"a", "chExt">, readonly [Attr<"cx", ST_PositiveCoordinate>, Attr<"cy", ST_PositiveCoordinate>], Empty>;

export type CT_GroupTransform2D = Element<
    QName<"a", "xfrm">,
    AttrSeq<OptAttr<"rot", ST_Angle>, AttrSeq<OptAttr<"flipH", ST_Boolean>, OptAttr<"flipV", ST_Boolean>>>,
    Seq<
        Opt<CT_Point2D>,
        Seq<
            Opt<CT_PositiveSize2D>,
            Seq<Opt<CT_ChildOffset2D>, Opt<CT_ChildSize2D>>
        >
    >
>;

// Opacity, as a positive fixed percentage in thousandths of a percent: 100000 is fully opaque, 0 transparent.
export type ST_PositiveFixedPercentage = number;
export type CT_Alpha = Element<QName<"a", "alpha">, readonly [Attr<"val", ST_PositiveFixedPercentage>], Empty>;

export type EG_ColorTransform = CT_Alpha;

export type CT_SRgbColor = Element<
    QName<"a", "srgbClr">,
    readonly [Attr<"val", ST_HexColorRGB>],
    ReadonlyArray<EG_ColorTransform>
>;

export type CT_SolidColorFillProperties = Element<
    QName<"a", "solidFill">,
    Empty,
    readonly [CT_SRgbColor]
>;

export type CT_GradientStop = Element<QName<"a", "gs">, readonly [Attr<"pos", ST_PositiveFixedPercentage>], readonly [CT_SRgbColor]>;
export type CT_GradientStopList = Element<QName<"a", "gsLst">, Empty, ReadonlyArray<CT_GradientStop>>;
export type CT_RelativeRect = Element<
    QName<"a", "fillToRect">,
    readonly [Attr<"l", ST_Percentage>, Attr<"t", ST_Percentage>, Attr<"r", ST_Percentage>, Attr<"b", ST_Percentage>],
    Empty
>;
export type CT_PathShadeProperties = Element<QName<"a", "path">, readonly [Attr<"path", "circle">], readonly [CT_RelativeRect]>;
export type CT_LinearShadeProperties = Element<QName<"a", "lin">, readonly [Attr<"ang", ST_Angle>, Attr<"scaled", ST_Boolean>], Empty>;
export type CT_GradientFillProperties = Element<QName<"a", "gradFill">, Empty, readonly [CT_GradientStopList, CT_PathShadeProperties | CT_LinearShadeProperties]>;
export type CT_NoFill = Element<QName<"a", "noFill">, Empty, Empty>;
export type FillProperties = CT_SolidColorFillProperties | CT_GradientFillProperties | CT_NoFill;

export type CT_OuterShadow = Element<
    QName<"a", "outerShdw">,
    ReadonlyArray<Attr<"blurRad", ST_PositiveCoordinate> | Attr<"dist", ST_PositiveCoordinate> | Attr<"dir", ST_Angle> | Attr<"rotWithShape", ST_Boolean>>,
    readonly [CT_SRgbColor]
>;
export type CT_BlurEffect = Element<QName<"a", "blur">, readonly [Attr<"rad", ST_PositiveCoordinate>], Empty>;
export type CT_EffectList = Element<QName<"a", "effectLst">, Empty, ReadonlyArray<CT_OuterShadow | CT_BlurEffect>>;

export type CT_GeomGuide = Element<
    QName<"a", "gd">,
    readonly [Attr<"name", string>, Attr<"fmla", string>],
    Empty
>;

export type CT_GeomGuideList = Element<QName<"a", "avLst">, Empty, Many<CT_GeomGuide>>;

export type CT_PresetGeometry2D = Element<
    QName<"a", "prstGeom">,
    readonly [Attr<"prst", ST_ShapeType>],
    readonly [CT_GeomGuideList]
>;

// Custom geometry (ECMA-376 20.1.9): a shape drawn from an explicit path instead of a preset, so PowerPoint's
// morph can tween the geometry across slides. Only the moveTo/lnTo/close commands SVG lines and polygons need.
export type CT_AdjPoint2D = Element<QName<"a", "pt">, readonly [Attr<"x", ST_Coordinate>, Attr<"y", ST_Coordinate>], Empty>;
export type CT_Path2DMoveTo = Element<QName<"a", "moveTo">, Empty, readonly [CT_AdjPoint2D]>;
export type CT_Path2DLineTo = Element<QName<"a", "lnTo">, Empty, readonly [CT_AdjPoint2D]>;
export type CT_Path2DClose = Element<QName<"a", "close">, Empty, Empty>;
export type CT_Path2DCommand = CT_Path2DMoveTo | CT_Path2DLineTo | CT_Path2DClose;
export type CT_Path2D = Element<QName<"a", "path">, readonly [Attr<"w", ST_PositiveCoordinate>, Attr<"h", ST_PositiveCoordinate>], Many<CT_Path2DCommand>>;
export type CT_Path2DList = Element<QName<"a", "pathLst">, Empty, Many<CT_Path2D>>;
export type CT_CustomGeometry2D = Element<QName<"a", "custGeom">, Empty, readonly [CT_Path2DList]>;
export type Geometry = CT_PresetGeometry2D | CT_CustomGeometry2D;

export type CT_TextFont = Element<QName<"a", "latin">, readonly [Attr<"typeface", string>], Empty>;

export type CT_Highlight = Element<QName<"a", "highlight">, Empty, readonly [CT_SRgbColor]>;

// A union of the N allowed attributes, applied as any subset in any order -- a fixed "subset tuple" would expand
// into 2^N members.
export type RunPropertyAttr =
    | Attr<"kumimoji", ST_Boolean>
    | Attr<"lang", ST_TextLanguageID>
    | Attr<"altLang", ST_TextLanguageID>
    | Attr<"sz", ST_TextFontSize>
    | Attr<"b", ST_Boolean>
    | Attr<"i", ST_Boolean>
    | Attr<"u", ST_TextUnderlineType>
    | Attr<"strike", ST_TextStrikeType>
    | Attr<"kern", ST_TextNonNegativePoint>
    | Attr<"cap", ST_TextCapsType>
    | Attr<"spc", ST_TextPoint>
    | Attr<"normalizeH", ST_Boolean>
    | Attr<"baseline", ST_Percentage>
    | Attr<"noProof", ST_Boolean>
    | Attr<"dirty", ST_Boolean>
    | Attr<"err", ST_Boolean>
    | Attr<"smtClean", ST_Boolean>
    | Attr<"smtId", number>
    | Attr<"bmk", string>;

export type CT_TextCharacterProperties = Element<
    QName<"a", "rPr">,
    ReadonlyArray<RunPropertyAttr>,
    Many<CT_SolidColorFillProperties | CT_Highlight | CT_TextFont>
>;

export type ParagraphPropertyAttr =
    | Attr<"marL", ST_TextMargin>
    | Attr<"marR", ST_TextMargin>
    | Attr<"lvl", ST_TextIndentLevelType>
    | Attr<"indent", ST_TextIndent>
    | Attr<"algn", ST_TextAlignType>
    | Attr<"defTabSz", ST_Coordinate32>
    | Attr<"rtl", ST_Boolean>
    | Attr<"eaLnBrk", ST_Boolean>
    | Attr<"fontAlgn", ST_TextFontAlignType>
    | Attr<"latinLnBrk", ST_Boolean>
    | Attr<"hangingPunct", ST_Boolean>;

export type ST_TextSpacingPoint = number; // A spacing in hundredths of a point, 0..158400.
export type ST_TextSpacingPercent = number; // A spacing as a percentage in thousandths, e.g. 150000 for 150%.

export type CT_TextSpacingPoint = Element<QName<"a", "spcPts">, ReqAttr<"val", ST_TextSpacingPoint>, Empty>;
export type CT_TextSpacingPercent = Element<QName<"a", "spcPct">, ReqAttr<"val", ST_TextSpacingPercent>, Empty>;

type TextSpacingValue = One<CT_TextSpacingPoint> | One<CT_TextSpacingPercent>;
export type CT_LineSpacing = Element<QName<"a", "lnSpc">, Empty, TextSpacingValue>;
export type CT_SpaceBefore = Element<QName<"a", "spcBef">, Empty, TextSpacingValue>;
export type CT_SpaceAfter = Element<QName<"a", "spcAft">, Empty, TextSpacingValue>;

export type CT_TextParagraphProperties = Element<
    QName<"a", "pPr">,
    ReadonlyArray<ParagraphPropertyAttr>,
    Seq<Opt<CT_LineSpacing>, Seq<Opt<CT_SpaceBefore>, Opt<CT_SpaceAfter>>>
>;

export type BodyPropertyAttr =
    | Attr<"rot", ST_Angle>
    | Attr<"spcFirstLastPara", ST_Boolean>
    | Attr<"vertOverflow", ST_TextVertOverflowType>
    | Attr<"horzOverflow", ST_TextHorzOverflowType>
    | Attr<"vert", ST_TextVerticalType>
    | Attr<"wrap", ST_TextWrappingType>
    | Attr<"lIns", ST_Coordinate32>
    | Attr<"tIns", ST_Coordinate32>
    | Attr<"rIns", ST_Coordinate32>
    | Attr<"bIns", ST_Coordinate32>
    | Attr<"numCol", ST_TextColumnCount>
    | Attr<"spcCol", ST_PositiveCoordinate32>
    | Attr<"rtlCol", ST_Boolean>
    | Attr<"fromWordArt", ST_Boolean>
    | Attr<"anchor", ST_TextAnchoringType>
    | Attr<"anchorCtr", ST_Boolean>
    | Attr<"forceAA", ST_Boolean>
    | Attr<"upright", ST_Boolean>
    | Attr<"compatLnSpc", ST_Boolean>;

export type CT_TextBodyProperties = Element<QName<"a", "bodyPr">, ReadonlyArray<BodyPropertyAttr>, Empty>;

export type CT_RegularTextRun = Element<
    QName<"a", "r">,
    Empty,
    Seq<Opt<CT_TextCharacterProperties>, readonly [Element<QName<"a", "t">, Empty, readonly [Text]>]>
>;

export type CT_TextParagraph = Element<
    QName<"a", "p">,
    Empty,
    Seq<Opt<CT_TextParagraphProperties>, Many<CT_RegularTextRun>>
>;

export type CT_Blip = Element<QName<"a", "blip">, readonly [Attr<"r:embed", string>], Empty>;

export type CT_StretchInfoProperties = Element<
    QName<"a", "stretch">,
    Empty,
    readonly [Element<QName<"a", "fillRect">, Empty, Empty>]
>;

export type CT_BlipFillProperties = Element<
    QName<"a", "blipFill">,
    Empty,
    readonly [CT_Blip, CT_StretchInfoProperties]
>;

export type ST_LineWidth = number; // A line width in EMU, 0..20116800.

export type CT_PresetLineDashProperties = Element<QName<"a", "prstDash">, readonly [Attr<"val", ST_PresetLineDashVal>], Empty>;

export type LinePropertyAttr =
    | Attr<"w", ST_LineWidth>
    | Attr<"cap", ST_LineCap>
    | Attr<"cmpd", ST_CompoundLine>
    | Attr<"algn", ST_PenAlignment>;

// `a:ln` and the four table-cell border elements (a:lnL/lnR/lnT/lnB) share this content model; the element name
// is the type parameter so each border keeps its own tag while reusing one definition.
export type CT_LineProperties<Tag extends string = QName<"a", "ln">> = Element<
    Tag,
    ReadonlyArray<LinePropertyAttr>,
    Seq<Opt<CT_SolidColorFillProperties>, Opt<CT_PresetLineDashProperties>>
>;

export type CT_TextBody = Element<
    QName<"a", "txBody">,
    Empty,
    Seq<readonly [CT_TextBodyProperties], Many<CT_TextParagraph>>
>;

export type TableCellPropertyAttr =
    | Attr<"marL", ST_Coordinate32>
    | Attr<"marR", ST_Coordinate32>
    | Attr<"marT", ST_Coordinate32>
    | Attr<"marB", ST_Coordinate32>
    | Attr<"vert", ST_TextVerticalType>
    | Attr<"anchor", ST_TextAnchoringType>
    | Attr<"anchorCtr", ST_Boolean>
    | Attr<"horzOverflow", ST_TextHorzOverflowType>;

export type CT_TableCellProperties = Element<
    QName<"a", "tcPr">,
    ReadonlyArray<TableCellPropertyAttr>,
    Seq<
        Opt<CT_LineProperties<QName<"a", "lnL">>>,
        Seq<
            Opt<CT_LineProperties<QName<"a", "lnR">>>,
            Seq<
                Opt<CT_LineProperties<QName<"a", "lnT">>>,
                Seq<Opt<CT_LineProperties<QName<"a", "lnB">>>, Opt<CT_SolidColorFillProperties>>
            >
        >
    >
>;

export type TableCellAttr =
    | Attr<"rowSpan", number>
    | Attr<"gridSpan", number>
    | Attr<"hMerge", ST_Boolean>
    | Attr<"vMerge", ST_Boolean>;

export type CT_TableCell = Element<
    QName<"a", "tc">,
    ReadonlyArray<TableCellAttr>,
    Seq<Opt<CT_TextBody>, Opt<CT_TableCellProperties>>
>;

export type CT_TableRow = Element<QName<"a", "tr">, readonly [Attr<"h", ST_Coordinate>], Many<CT_TableCell>>;

export type CT_TableCol = Element<QName<"a", "gridCol">, readonly [Attr<"w", ST_PositiveCoordinate>], Empty>;
export type CT_TableGrid = Element<QName<"a", "tblGrid">, Empty, Many<CT_TableCol>>;

export type TablePropertyAttr =
    | Attr<"rtl", ST_Boolean>
    | Attr<"firstRow", ST_Boolean>
    | Attr<"firstCol", ST_Boolean>
    | Attr<"lastRow", ST_Boolean>
    | Attr<"lastCol", ST_Boolean>
    | Attr<"bandRow", ST_Boolean>
    | Attr<"bandCol", ST_Boolean>;

export type CT_TableStyleId = Element<QName<"a", "tableStyleId">, Empty, readonly [Text]>;
export type CT_TableProperties = Element<QName<"a", "tblPr">, ReadonlyArray<TablePropertyAttr>, Opt<CT_TableStyleId>>;

export type CT_Table = Element<
    QName<"a", "tbl">,
    Empty,
    Seq<Opt<CT_TableProperties>, Seq<readonly [CT_TableGrid], Many<CT_TableRow>>>
>;

// `a:graphicData` is open content: the child is whatever the `uri`'s namespace defines (a table, a chart ref, ...).
export type CT_GraphicalObjectData = Element<QName<"a", "graphicData">, readonly [Attr<"uri", string>], readonly [Node]>;
export type CT_GraphicalObject = Element<QName<"a", "graphic">, Empty, readonly [CT_GraphicalObjectData]>;

export type DrawingMLElement =
    | CT_Point2D
    | CT_PositiveSize2D
    | CT_Transform2D
    | CT_SRgbColor
    | CT_SolidColorFillProperties
    | CT_PresetGeometry2D
    | CT_TextCharacterProperties
    | CT_TextParagraphProperties
    | CT_TextBodyProperties
    | CT_RegularTextRun
    | CT_TextParagraph
    | CT_TextBody
    | CT_BlipFillProperties
    | CT_PresetLineDashProperties
    | CT_LineProperties
    | CT_TableCellProperties
    | CT_TableCell
    | CT_TableRow
    | CT_TableCol
    | CT_TableGrid
    | CT_TableStyleId
    | CT_TableProperties
    | CT_Table
    | CT_GraphicalObjectData
    | CT_GraphicalObject;

/* eslint-enable @typescript-eslint/naming-convention */
