import { element } from "@dropdeck/xml";
import { Namespace } from "@dropdeck/oox";
import { cNvPr, cSld, grpSpPr, nvGrpSpPr, spTree } from "../presentationml/builders.js";
import type { Element } from "@dropdeck/xml";

const SLIDE_WIDTH_EMU = 12192000;
const SLIDE_HEIGHT_EMU = 6858000;
const NOTES_WIDTH_EMU = 6858000;
const NOTES_HEIGHT_EMU = 9144000;
const MASTER_ID = 2147483648; // p:sldMasterId ids start at 0x80000000; layout ids follow.
const LAYOUT_ID = 2147483649;
const FIRST_SLIDE_ID = 256; // p:sldId ids must be >= 256 and unique.

const CLR_MAP = element("p:clrMap", [
    ["bg1", "lt1"],
    ["tx1", "dk1"],
    ["bg2", "lt2"],
    ["tx2", "dk2"],
    ["accent1", "accent1"],
    ["accent2", "accent2"],
    ["accent3", "accent3"],
    ["accent4", "accent4"],
    ["accent5", "accent5"],
    ["accent6", "accent6"],
    ["hlink", "hlink"],
    ["folHlink", "folHlink"]
], []);

function emptyTree(): Element<"p:cSld"> {
    return cSld(spTree(nvGrpSpPr(cNvPr(1, "")), grpSpPr()));
}

export function presentationProperties(): Element<"p:presentationPr"> {
    return element("p:presentationPr", [["xmlns:p", Namespace.PresentationML], ["xmlns:r", Namespace.OfficeRelationships]], []);
}

export function slideMaster(layoutRelId: string): Element<"p:sldMaster"> {
    const layoutList = element("p:sldLayoutIdLst", [], [element("p:sldLayoutId", [["id", LAYOUT_ID], ["r:id", layoutRelId]], [])]);
    const txStyles = element("p:txStyles", [], [
        element("p:titleStyle", [], []),
        element("p:bodyStyle", [], []),
        element("p:otherStyle", [], [])
    ]);
    return element("p:sldMaster", [["xmlns:p", Namespace.PresentationML], ["xmlns:a", Namespace.DrawingML], ["xmlns:r", Namespace.OfficeRelationships]], [emptyTree(), CLR_MAP, layoutList, txStyles]);
}

export function slideLayout(): Element<"p:sldLayout"> {
    const override = element("p:clrMapOvr", [], [element("a:masterClrMapping", [], [])]);
    const attrs = [["xmlns:p", Namespace.PresentationML], ["xmlns:a", Namespace.DrawingML], ["xmlns:r", Namespace.OfficeRelationships], ["type", "blank"], ["preserve", 1]] as const;
    return element("p:sldLayout", attrs, [emptyTree(), override]);
}

export function presentation(masterRelId: string, slideRelIds: ReadonlyArray<string>): Element<"p:presentation"> {
    const masters = element("p:sldMasterIdLst", [], [element("p:sldMasterId", [["id", MASTER_ID], ["r:id", masterRelId]], [])]);
    const slideIds = slideRelIds.map((relId, index) => element("p:sldId", [["id", FIRST_SLIDE_ID + index], ["r:id", relId]], []));
    return element("p:presentation", [["xmlns:a", Namespace.DrawingML], ["xmlns:r", Namespace.OfficeRelationships], ["xmlns:p", Namespace.PresentationML]], [
        masters,
        element("p:sldIdLst", [], slideIds),
        element("p:sldSz", [["cx", SLIDE_WIDTH_EMU], ["cy", SLIDE_HEIGHT_EMU], ["type", "screen16x9"]], []),
        element("p:notesSz", [["cx", NOTES_WIDTH_EMU], ["cy", NOTES_HEIGHT_EMU]], [])
    ]);
}
