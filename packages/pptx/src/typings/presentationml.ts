/* eslint-disable @typescript-eslint/naming-convention -- CT_* mirror the ECMA-376 schema names verbatim. */

import type {
    Attr,
    AttrSeq,
    Element,
    Empty,
    Many,
    Opt,
    OptAttr,
    Seq
} from "@dropdeck/xml";
import type { ST_Boolean, ST_String } from "@dropdeck/oox";
import type { QName } from "@dropdeck/oox";
import type {
    CT_Blip,
    CT_GraphicalObject,
    CT_GroupTransform2D,
    CT_Point2D,
    CT_PositiveSize2D,
    Geometry,
    CT_EffectList,
    CT_LineProperties,
    CT_SolidColorFillProperties,
    FillProperties,
    CT_StretchInfoProperties,
    CT_TextBodyProperties,
    CT_TextParagraph,
    CT_Transform2D,
    ST_Angle,
    ST_DrawingElementId
} from "./drawingml.js";
import type {
    ST_TransitionSpeed,
    ST_TransitionSideDirectionType,
    ST_TransitionEightDirectionType
} from "../presentationml/Specification.js";

export type CT_NonVisualDrawingProps = Element<
    QName<"p", "cNvPr">,
    readonly [Attr<"id", ST_DrawingElementId>, Attr<"name", ST_String>],
    Empty
>;

export type CT_NonVisualDrawingShapeProps = Element<QName<"p", "cNvSpPr">, Empty, Empty>;
export type CT_NonVisualGroupDrawingShapeProps = Element<QName<"p", "cNvGrpSpPr">, Empty, Empty>;
export type CT_ApplicationNonVisualDrawingProps = Element<QName<"p", "nvPr">, Empty, Empty>;

export type CT_ShapeNonVisual = Element<
    QName<"p", "nvSpPr">,
    Empty,
    readonly [CT_NonVisualDrawingProps, CT_NonVisualDrawingShapeProps, CT_ApplicationNonVisualDrawingProps]
>;

export type CT_GroupShapeNonVisual = Element<
    QName<"p", "nvGrpSpPr">,
    Empty,
    readonly [CT_NonVisualDrawingProps, CT_NonVisualGroupDrawingShapeProps, CT_ApplicationNonVisualDrawingProps]
>;

export type CT_ShapeProperties = Element<
    QName<"p", "spPr">,
    Empty,
    Seq<Opt<CT_Transform2D>, Seq<Opt<Geometry>, Seq<Opt<FillProperties>, Seq<Opt<CT_LineProperties>, Opt<CT_EffectList>>>>>
>;

export type CT_GroupShapeProperties = Element<
    QName<"p", "grpSpPr">,
    Empty,
    Seq<Opt<CT_GroupTransform2D>, Opt<CT_SolidColorFillProperties>>
>;

export type CT_TextBody = Element<
    QName<"p", "txBody">,
    Empty,
    Seq<readonly [CT_TextBodyProperties], Many<CT_TextParagraph>>
>;

export type CT_Shape = Element<
    QName<"p", "sp">,
    Empty,
    Seq<readonly [CT_ShapeNonVisual, CT_ShapeProperties], Opt<CT_TextBody>>
>;

export type CT_PictureLocking = Element<QName<"a", "picLocks">, readonly [Attr<"noChangeAspect", ST_Boolean>], Empty>;

export type CT_NonVisualPictureProperties = Element<QName<"p", "cNvPicPr">, Empty, Opt<CT_PictureLocking>>;

export type CT_PictureNonVisual = Element<
    QName<"p", "nvPicPr">,
    Empty,
    readonly [CT_NonVisualDrawingProps, CT_NonVisualPictureProperties, CT_ApplicationNonVisualDrawingProps]
>;

export type CT_PictureBlipFill = Element<QName<"p", "blipFill">, Empty, readonly [CT_Blip, CT_StretchInfoProperties]>;

export type CT_Picture = Element<
    QName<"p", "pic">,
    Empty,
    readonly [CT_PictureNonVisual, CT_PictureBlipFill, CT_ShapeProperties]
>;

export type CT_NonVisualConnectorProperties = Element<QName<"p", "cNvCxnSpPr">, Empty, Empty>;

export type CT_ConnectorNonVisual = Element<
    QName<"p", "nvCxnSpPr">,
    Empty,
    readonly [CT_NonVisualDrawingProps, CT_NonVisualConnectorProperties, CT_ApplicationNonVisualDrawingProps]
>;

export type CT_Connector = Element<QName<"p", "cxnSp">, Empty, readonly [CT_ConnectorNonVisual, CT_ShapeProperties]>;

export type CT_NonVisualGraphicFrameProperties = Element<QName<"p", "cNvGraphicFramePr">, Empty, Empty>;

export type CT_GraphicalObjectFrameNonVisual = Element<
    QName<"p", "nvGraphicFramePr">,
    Empty,
    readonly [CT_NonVisualDrawingProps, CT_NonVisualGraphicFrameProperties, CT_ApplicationNonVisualDrawingProps]
>;

// A graphic frame's own `<p:xfrm>` transform, distinct from a shape's `<a:xfrm>`.
export type CT_GraphicFrameTransform = Element<
    QName<"p", "xfrm">,
    AttrSeq<OptAttr<"rot", ST_Angle>, AttrSeq<OptAttr<"flipH", ST_Boolean>, OptAttr<"flipV", ST_Boolean>>>,
    readonly [CT_Point2D, CT_PositiveSize2D]
>;

export type CT_GraphicalObjectFrame = Element<
    QName<"p", "graphicFrame">,
    Empty,
    readonly [CT_GraphicalObjectFrameNonVisual, CT_GraphicFrameTransform, CT_GraphicalObject]
>;

export type SpTreeMember = CT_Shape | CT_GroupShapeChild | CT_GraphicalObjectFrame | CT_Connector | CT_Picture;

// A group nested in a group only defers through a plain `ReadonlyArray`, not a tuple spread, so the content is
// the array of all admitted children; the builder emits the two property elements first.
export type CT_GroupShapeContent = ReadonlyArray<CT_GroupShapeNonVisual | CT_GroupShapeProperties | SpTreeMember>;

export type CT_GroupShapeChild = Element<QName<"p", "grpSp">, Empty, CT_GroupShapeContent>;

export type CT_GroupShape = Element<QName<"p", "spTree">, Empty, CT_GroupShapeContent>;

export type CT_CommonSlideData = Element<QName<"p", "cSld">, Empty, readonly [CT_GroupShape]>;

export type CT_TransitionFade = Element<QName<"p", "fade">, OptAttr<"thruBlk", ST_Boolean>, Empty>;
export type CT_TransitionCut = Element<QName<"p", "cut">, OptAttr<"thruBlk", ST_Boolean>, Empty>;
export type CT_TransitionDissolve = Element<QName<"p", "dissolve">, Empty, Empty>;
export type CT_TransitionWipe = Element<QName<"p", "wipe">, OptAttr<"dir", ST_TransitionSideDirectionType>, Empty>;
export type CT_TransitionPush = Element<QName<"p", "push">, OptAttr<"dir", ST_TransitionSideDirectionType>, Empty>;
export type CT_TransitionCover = Element<QName<"p", "cover">, OptAttr<"dir", ST_TransitionEightDirectionType>, Empty>;

export type SlideTransitionEffect =
    | CT_TransitionFade
    | CT_TransitionCut
    | CT_TransitionDissolve
    | CT_TransitionWipe
    | CT_TransitionPush
    | CT_TransitionCover;

export type CT_SlideTransition = Element<
    QName<"p", "transition">,
    AttrSeq<OptAttr<"spd", ST_TransitionSpeed>, AttrSeq<OptAttr<"advClick", ST_Boolean>, OptAttr<"advTm", number>>>,
    readonly [SlideTransitionEffect]
>;

export type CT_Slide = Element<
    QName<"p", "sld">,
    readonly [Attr<"xmlns:a", ST_String>, Attr<"xmlns:p", ST_String>, Attr<"xmlns:r", ST_String>],
    Seq<readonly [CT_CommonSlideData], Opt<CT_SlideTransition>>
>;

export type PresentationMLElement =
    | CT_NonVisualDrawingProps
    | CT_ShapeNonVisual
    | CT_GroupShapeNonVisual
    | CT_ShapeProperties
    | CT_GroupShapeProperties
    | CT_TextBody
    | CT_Shape
    | CT_Picture
    | CT_Connector
    | CT_GraphicalObjectFrame
    | CT_GroupShapeChild
    | CT_GroupShape
    | CT_CommonSlideData
    | CT_SlideTransition
    | CT_Slide;

/* eslint-enable @typescript-eslint/naming-convention */
