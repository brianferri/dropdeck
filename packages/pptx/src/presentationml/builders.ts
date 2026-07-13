import { Namespace, element } from "../oox.js";
import { blip, ext, graphic, graphicData, off, prstGeom, xfrm } from "../drawingml/builders.js";
import { chartRef } from "../drawingml/chart/index.js";
import type { Element, Empty, ST_String } from "../oox.js";
import type {
    CT_GraphicalObject,
    CT_Point2D,
    CT_PositiveSize2D,
    CT_Table,
    ST_Coordinate,
    ST_DrawingElementId,
    ST_PositiveCoordinate
} from "../typings/drawingml.js";
import type {
    CT_ApplicationNonVisualDrawingProps,
    CT_CommonSlideData,
    CT_ConnectorNonVisual,
    CT_GraphicalObjectFrame,
    CT_GraphicalObjectFrameNonVisual,
    CT_GraphicFrameTransform,
    CT_GroupShape,
    CT_GroupShapeChild,
    CT_GroupShapeProperties,
    CT_NonVisualConnectorProperties,
    CT_NonVisualDrawingProps,
    CT_NonVisualDrawingShapeProps,
    CT_NonVisualGraphicFrameProperties,
    CT_NonVisualGroupDrawingShapeProps,
    CT_Picture,
    CT_PictureBlipFill,
    CT_PictureNonVisual,
    CT_ShapeNonVisual,
    CT_ShapeProperties,
    CT_Slide,
    CT_SlideTransition,
    CT_TextBody,
    SlideTransitionEffect
} from "../typings/presentationml.js";
import type {
    ST_TransitionEightDirectionType,
    ST_TransitionSideDirectionType,
    ST_TransitionSpeed
} from "./Specification.js";

const TABLE_URI = "http://schemas.openxmlformats.org/drawingml/2006/table";
const CHART_URI = "http://schemas.openxmlformats.org/drawingml/2006/chart";

export function cNvPr<const I extends ST_DrawingElementId, const N extends ST_String>(
    id: I,
    name: N
): Element<"p:cNvPr", readonly [readonly ["id", I], readonly ["name", N]], Empty> {
    return element("p:cNvPr", [["id", id], ["name", name]], []);
}

export function cNvSpPr(): CT_NonVisualDrawingShapeProps {
    return element("p:cNvSpPr", [], []);
}

export function cNvGrpSpPr(): CT_NonVisualGroupDrawingShapeProps {
    return element("p:cNvGrpSpPr", [], []);
}

export function nvPr(): CT_ApplicationNonVisualDrawingProps {
    return element("p:nvPr", [], []);
}

export function nvSpPr<const P extends CT_NonVisualDrawingProps>(props: P): Element<"p:nvSpPr", Empty, readonly [P, CT_NonVisualDrawingShapeProps, CT_ApplicationNonVisualDrawingProps]> {
    return element("p:nvSpPr", [], [props, cNvSpPr(), nvPr()]);
}

export function nvGrpSpPr<const P extends CT_NonVisualDrawingProps>(props: P): Element<"p:nvGrpSpPr", Empty, readonly [P, CT_NonVisualGroupDrawingShapeProps, CT_ApplicationNonVisualDrawingProps]> {
    return element("p:nvGrpSpPr", [], [props, cNvGrpSpPr(), nvPr()]);
}

export function grpSpPr<const C extends CT_GroupShapeProperties["children"]>(...children: C): Element<"p:grpSpPr", Empty, C> {
    return element("p:grpSpPr", [], children);
}

export function spPr<const C extends CT_ShapeProperties["children"]>(...children: C): Element<"p:spPr", Empty, C> {
    return element("p:spPr", [], children);
}

export function txBody<const C extends CT_TextBody["children"]>(...children: C): Element<"p:txBody", Empty, C> {
    return element("p:txBody", [], children);
}

export function sp<const NV extends CT_ShapeNonVisual, const SP extends CT_ShapeProperties, const TX extends CT_TextBody>(
    nonVisual: NV,
    properties: SP,
    body: TX
): Element<"p:sp", Empty, readonly [NV, SP, TX]> {
    return element("p:sp", [], [nonVisual, properties, body]);
}

export function spTree<const C extends CT_GroupShape["children"]>(...children: C): Element<"p:spTree", Empty, C> {
    return element("p:spTree", [], children);
}

export function grpSp<const C extends CT_GroupShapeChild["children"]>(...children: C): Element<"p:grpSp", Empty, C> {
    return element("p:grpSp", [], children);
}

export function cNvCxnSpPr(): CT_NonVisualConnectorProperties {
    return element("p:cNvCxnSpPr", [], []);
}

export function nvCxnSpPr<const P extends CT_NonVisualDrawingProps>(props: P): Element<"p:nvCxnSpPr", Empty, readonly [P, CT_NonVisualConnectorProperties, CT_ApplicationNonVisualDrawingProps]> {
    return element("p:nvCxnSpPr", [], [props, cNvCxnSpPr(), nvPr()]);
}

export function cxnSp<const NV extends CT_ConnectorNonVisual, const SP extends CT_ShapeProperties>(
    nonVisual: NV,
    properties: SP
): Element<"p:cxnSp", Empty, readonly [NV, SP]> {
    return element("p:cxnSp", [], [nonVisual, properties]);
}

export function nvGraphicFramePr<const P extends CT_NonVisualDrawingProps>(props: P): Element<
    "p:nvGraphicFramePr",
    Empty,
    readonly [P, CT_NonVisualGraphicFrameProperties, CT_ApplicationNonVisualDrawingProps]
> {
    return element("p:nvGraphicFramePr", [], [props, element("p:cNvGraphicFramePr", [], []), nvPr()]);
}

export function graphicFrameXfrm<const O extends CT_Point2D, const E extends CT_PositiveSize2D>(
    offset: O,
    extent: E
): Element<"p:xfrm", Empty, readonly [O, E]> {
    return element("p:xfrm", [], [offset, extent]);
}

export function graphicFrame<
    const NV extends CT_GraphicalObjectFrameNonVisual,
    const X extends CT_GraphicFrameTransform,
    const G extends CT_GraphicalObject
>(nonVisual: NV, transform: X, object: G): Element<"p:graphicFrame", Empty, readonly [NV, X, G]> {
    return element("p:graphicFrame", [], [nonVisual, transform, object]);
}

export function tableFrame<const T extends CT_Table>(
    id: ST_DrawingElementId,
    name: ST_String,
    offsetX: ST_Coordinate,
    offsetY: ST_Coordinate,
    extentX: ST_PositiveCoordinate,
    extentY: ST_PositiveCoordinate,
    table: T
): CT_GraphicalObjectFrame {
    return graphicFrame(nvGraphicFramePr(cNvPr(id, name)), graphicFrameXfrm(off(offsetX, offsetY), ext(extentX, extentY)), graphic(graphicData(TABLE_URI, table)));
}

// A chart lives in its own part; the frame only carries a `<c:chart r:id>` reference resolved via the slide rels.
export function chartFrame(
    id: ST_DrawingElementId,
    name: ST_String,
    offsetX: ST_Coordinate,
    offsetY: ST_Coordinate,
    extentX: ST_PositiveCoordinate,
    extentY: ST_PositiveCoordinate,
    chartRelId: string
): CT_GraphicalObjectFrame {
    return graphicFrame(nvGraphicFramePr(cNvPr(id, name)), graphicFrameXfrm(off(offsetX, offsetY), ext(extentX, extentY)), graphic(graphicData(CHART_URI, chartRef(chartRelId))));
}

// The `cNvPicPr` child is spelled as the exact element built (a non-aspect lock), not the schema's
// `CT_NonVisualPictureProperties` whose optional content would widen the serialised type away from a literal.
export function nvPicPr<const P extends CT_NonVisualDrawingProps>(props: P): Element<"p:nvPicPr", Empty, readonly [
    P,
    Element<"p:cNvPicPr", Empty, readonly [Element<"a:picLocks", readonly [readonly ["noChangeAspect", true]], Empty>]>,
    CT_ApplicationNonVisualDrawingProps
]> {
    const locks = element("p:cNvPicPr", [], [element("a:picLocks", [["noChangeAspect", true]], [])]);
    return element("p:nvPicPr", [], [props, locks, nvPr()]);
}

export function picBlipFill<const E extends string>(embed: E): Element<"p:blipFill", Empty, readonly [
    Element<"a:blip", readonly [readonly ["r:embed", E]], Empty>,
    Element<"a:stretch", Empty, readonly [Element<"a:fillRect", Empty, Empty>]>
]> {
    return element("p:blipFill", [], [blip(embed), element("a:stretch", [], [element("a:fillRect", [], [])])]);
}

export function pic<const NV extends CT_PictureNonVisual, const F extends CT_PictureBlipFill, const SP extends CT_ShapeProperties>(
    nonVisual: NV,
    fill: F,
    properties: SP
): Element<"p:pic", Empty, readonly [NV, F, SP]> {
    return element("p:pic", [], [nonVisual, fill, properties]);
}

export function picture(
    id: ST_DrawingElementId,
    name: ST_String,
    embed: string,
    offsetX: ST_Coordinate,
    offsetY: ST_Coordinate,
    extentX: ST_PositiveCoordinate,
    extentY: ST_PositiveCoordinate
): CT_Picture {
    return pic(nvPicPr(cNvPr(id, name)), picBlipFill(embed), spPr(xfrm(off(offsetX, offsetY), ext(extentX, extentY)), prstGeom("rect")));
}

export function fade(): Element<"p:fade", Empty, Empty> {
    return element("p:fade", [], []);
}

export function cut(): Element<"p:cut", Empty, Empty> {
    return element("p:cut", [], []);
}

export function dissolve(): Element<"p:dissolve", Empty, Empty> {
    return element("p:dissolve", [], []);
}

export function wipe<const D extends ST_TransitionSideDirectionType>(direction: D): Element<"p:wipe", readonly [readonly ["dir", D]], Empty> {
    return element("p:wipe", [["dir", direction]], []);
}

export function push<const D extends ST_TransitionSideDirectionType>(direction: D): Element<"p:push", readonly [readonly ["dir", D]], Empty> {
    return element("p:push", [["dir", direction]], []);
}

export function cover<const D extends ST_TransitionEightDirectionType>(direction: D): Element<"p:cover", readonly [readonly ["dir", D]], Empty> {
    return element("p:cover", [["dir", direction]], []);
}

export function transition<const E extends SlideTransitionEffect>(effect: E): Element<"p:transition", Empty, readonly [E]>;
export function transition<const E extends SlideTransitionEffect, const S extends ST_TransitionSpeed>(
    effect: E,
    speed: S
): Element<"p:transition", readonly [readonly ["spd", S]], readonly [E]>;
export function transition(effect: SlideTransitionEffect, speed?: ST_TransitionSpeed): CT_SlideTransition {
    return speed === undefined ? element("p:transition", [], [effect]) : element("p:transition", [["spd", speed]], [effect]);
}

export function cSld<const T extends CT_GroupShape>(tree: T): Element<"p:cSld", Empty, readonly [T]> {
    return element("p:cSld", [], [tree]);
}

const SLIDE_NAMESPACES = [["xmlns:a", Namespace.a], ["xmlns:p", Namespace.p], ["xmlns:r", Namespace.r]] as const;

export function slide<const C extends CT_CommonSlideData>(common: C): Element<"p:sld", typeof SLIDE_NAMESPACES, readonly [C]>;
export function slide<const C extends CT_CommonSlideData, const T extends CT_SlideTransition>(
    common: C,
    slideTransition: T
): Element<"p:sld", typeof SLIDE_NAMESPACES, readonly [C, T]>;
export function slide(common: CT_CommonSlideData, slideTransition?: CT_SlideTransition): CT_Slide {
    return slideTransition === undefined
        ? element("p:sld", SLIDE_NAMESPACES, [common])
        : element("p:sld", SLIDE_NAMESPACES, [common, slideTransition]);
}
