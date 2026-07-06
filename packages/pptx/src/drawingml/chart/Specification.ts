/* eslint-disable @typescript-eslint/naming-convention -- ST_*\/CT_* mirror the ECMA-376 DrawingML chart schema verbatim. */

import type {
    Attr,
    Element,
    Empty,
    Many,
    One,
    Opt,
    QName,
    ReqAttr,
    Seq,
    ST_Boolean,
    Text
} from "../../oox.js";

export enum ST_BarDir { Col = "col", Bar = "bar" }
export enum ST_BarGrouping { Clustered = "clustered", Stacked = "stacked", PercentStacked = "percentStacked", Standard = "standard" }
export enum ST_Orientation { MinMax = "minMax", MaxMin = "maxMin" }
export enum ST_AxPos { Bottom = "b", Left = "l", Top = "t", Right = "r" }

// A value-carrying leaf, e.g. `<c:barDir val="col"/>`.
export type CT_Value<Local extends string, T extends string | number | boolean> = Element<QName<"c", Local>, ReqAttr<"val", T>, Empty>;
type CText<Local extends string> = Element<QName<"c", Local>, Empty, One<Text>>;

// A single cached point: `<c:pt idx="0"><c:v>...</c:v></c:pt>`. String and numeric caches share the shape.
export type CT_NumVal = Element<QName<"c", "pt">, ReqAttr<"idx", number>, One<CText<"v">>>;
export type CT_StrVal = CT_NumVal;

export type CT_NumData = Element<QName<"c", "numCache">, Empty, Seq<Opt<CText<"formatCode">>, Seq<Opt<CT_Value<"ptCount", number>>, Many<CT_NumVal>>>>;
export type CT_StrData = Element<QName<"c", "strCache">, Empty, Seq<Opt<CT_Value<"ptCount", number>>, Many<CT_StrVal>>>;

export type CT_NumRef = Element<QName<"c", "numRef">, Empty, Seq<One<CText<"f">>, Opt<CT_NumData>>>;
export type CT_StrRef = Element<QName<"c", "strRef">, Empty, Seq<One<CText<"f">>, Opt<CT_StrData>>>;

// A category axis reads string labels; values and the series name read from their own single reference.
export type CT_AxDataSource = Element<QName<"c", "cat">, Empty, One<CT_StrRef>>;
export type CT_NumDataSource = Element<QName<"c", "val">, Empty, One<CT_NumRef>>;
export type CT_SerTx = Element<QName<"c", "tx">, Empty, One<CT_StrRef>>;

export type CT_BarSer = Element<
    QName<"c", "ser">,
    Empty,
    Seq<
        One<CT_Value<"idx", number>>,
        Seq<One<CT_Value<"order", number>>, Seq<Opt<CT_SerTx>, Seq<Opt<CT_AxDataSource>, One<CT_NumDataSource>>>>
    >
>;

export type CT_BarChart = Element<
    QName<"c", "barChart">,
    Empty,
    Seq<
        One<CT_Value<"barDir", ST_BarDir>>,
        Seq<
            Opt<CT_Value<"grouping", ST_BarGrouping>>,
            Seq<Many<CT_BarSer>, Seq<Opt<CT_Value<"gapWidth", number>>, Seq<Opt<CT_Value<"overlap", number>>, Many<CT_Value<"axId", number>>>>>
        >
    >
>;

export type CT_Scaling = Element<QName<"c", "scaling">, Empty, Opt<CT_Value<"orientation", ST_Orientation>>>;

// Axes carry a long optional tail in the schema; the required spine is id, scaling, position and the crossing id.
export type CT_CatAx = Element<
    QName<"c", "catAx">,
    Empty,
    Seq<
        One<CT_Value<"axId", number>>,
        Seq<One<CT_Scaling>, Seq<Opt<CT_Value<"delete", ST_Boolean>>, Seq<One<CT_Value<"axPos", ST_AxPos>>, One<CT_Value<"crossAx", number>>>>>
    >
>;
export type CT_ValAx = Element<
    QName<"c", "valAx">,
    Empty,
    Seq<
        One<CT_Value<"axId", number>>,
        Seq<One<CT_Scaling>, Seq<Opt<CT_Value<"delete", ST_Boolean>>, Seq<One<CT_Value<"axPos", ST_AxPos>>, One<CT_Value<"crossAx", number>>>>>
    >
>;

export type CT_PlotArea = Element<
    QName<"c", "plotArea">,
    Empty,
    Seq<One<Element<QName<"c", "layout">, Empty, Empty>>, Seq<One<CT_BarChart>, Seq<One<CT_CatAx>, One<CT_ValAx>>>>
>;

export type CT_Chart = Element<
    QName<"c", "chart">,
    Empty,
    Seq<Opt<CT_Value<"autoTitleDeleted", ST_Boolean>>, Seq<One<CT_PlotArea>, Opt<CT_Value<"plotVisOnly", ST_Boolean>>>>
>;

export type CT_ExternalData = Element<QName<"c", "externalData">, ReqAttr<"r:id", string>, Opt<CT_Value<"autoUpdate", ST_Boolean>>>;

type ChartSpaceAttrs = readonly [Attr<"xmlns:c", string>, Attr<"xmlns:a", string>, Attr<"xmlns:r", string>];
export type CT_ChartSpace = Element<QName<"c", "chartSpace">, ChartSpaceAttrs, Seq<One<CT_Chart>, Opt<CT_ExternalData>>>;

// The reference planted in a slide's `a:graphicData`; `r:id` points at the chart part that holds the data.
type RelIdAttrs = readonly [Attr<"xmlns:c", string>, Attr<"xmlns:r", string>, Attr<"r:id", string>];
export type CT_RelId = Element<QName<"c", "chart">, RelIdAttrs, Empty>;
