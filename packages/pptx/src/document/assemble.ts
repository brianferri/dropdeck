import { relationship, relationships } from "../package/builders.js";
import { ContentType, RelationshipType } from "../package/constants.js";
import { bytesPart, pack, xmlPart } from "../package/parts.js";
import { presentation, presentationProperties, slideLayout, slideMaster } from "./builders.js";
import { theme } from "./theme.js";
import type { CT_Slide } from "../presentationml/Specification.js";
import type { CT_Relationship } from "../package/Specification.js";
import type { Part } from "../package/parts.js";

const RELS = ContentType.Relationships;

// `relationshipId` must be rId2 onward: rId1 is reserved for the slide's layout relationship.
export type SlideMedia = {
    readonly relationshipId: string,
    readonly extension: string,
    readonly contentType: string,
    readonly data: Uint8Array
};

export type DeckSlide = { readonly slide: CT_Slide, readonly media: ReadonlyArray<SlideMedia> };

export type SlideInput = CT_Slide | DeckSlide;

function asDeckSlide(input: SlideInput): DeckSlide {
    return "slide" in input ? input : { slide: input, media: [] };
}

// The presentation must reference its master as rId1 and the slides as rId2 onward, which is what
// `presentation()` is told to emit.
export function toParts(slides: ReadonlyArray<SlideInput>): ReadonlyArray<Part> {
    const deckSlides = slides.map(asDeckSlide);
    const slideRelIds: Array<string> = [];
    for (let index = 0; index < deckSlides.length; index += 1) slideRelIds.push(`rId${index + 2}`);
    const presPropsRelId = `rId${deckSlides.length + 2}`;
    const themeRelId = `rId${deckSlides.length + 3}`;

    const parts: Array<Part> = [];
    parts.push(xmlPart("_rels/.rels", RELS, relationships([relationship("rId1", RelationshipType.OfficeDocument, "ppt/presentation.xml")])));

    parts.push(xmlPart("ppt/presentation.xml", ContentType.Presentation, presentation("rId1", slideRelIds)));
    parts.push(xmlPart("ppt/_rels/presentation.xml.rels", RELS, relationships(presentationRels(deckSlides.length, presPropsRelId, themeRelId))));

    parts.push(xmlPart("ppt/presProps.xml", ContentType.PresProps, presentationProperties()));
    parts.push(xmlPart("ppt/theme/theme1.xml", ContentType.Theme, theme()));

    parts.push(xmlPart("ppt/slideMasters/slideMaster1.xml", ContentType.SlideMaster, slideMaster("rId1")));
    parts.push(xmlPart("ppt/slideMasters/_rels/slideMaster1.xml.rels", RELS, relationships([
        relationship("rId1", RelationshipType.SlideLayout, "../slideLayouts/slideLayout1.xml"),
        relationship("rId2", RelationshipType.Theme, "../theme/theme1.xml")
    ])));

    parts.push(xmlPart("ppt/slideLayouts/slideLayout1.xml", ContentType.SlideLayout, slideLayout()));
    parts.push(xmlPart("ppt/slideLayouts/_rels/slideLayout1.xml.rels", RELS, relationships([relationship("rId1", RelationshipType.SlideMaster, "../slideMasters/slideMaster1.xml")])));

    let mediaCount = 0;
    for (let index = 0; index < deckSlides.length; index += 1) {
        const number = index + 1;
        const entry = deckSlides[index];
        parts.push(xmlPart(`ppt/slides/slide${number}.xml`, ContentType.Slide, entry.slide));
        const slideRels: Array<CT_Relationship> = [relationship("rId1", RelationshipType.SlideLayout, "../slideLayouts/slideLayout1.xml")];
        for (const item of entry.media) {
            mediaCount += 1;
            const mediaPath = `media/image${mediaCount}.${item.extension}`;
            slideRels.push(relationship(item.relationshipId, RelationshipType.Image, `../${mediaPath}`));
            parts.push(bytesPart(`ppt/${mediaPath}`, item.contentType, item.data));
        }
        parts.push(xmlPart(`ppt/slides/_rels/slide${number}.xml.rels`, RELS, relationships(slideRels)));
    }
    return parts;
}

function presentationRels(slideCount: number, presPropsRelId: string, themeRelId: string): ReadonlyArray<CT_Relationship> {
    const rels: Array<CT_Relationship> = [relationship("rId1", RelationshipType.SlideMaster, "slideMasters/slideMaster1.xml")];
    for (let index = 0; index < slideCount; index += 1) rels.push(relationship(`rId${index + 2}`, RelationshipType.Slide, `slides/slide${index + 1}.xml`));

    rels.push(relationship(presPropsRelId, RelationshipType.PresProps, "presProps.xml"));
    rels.push(relationship(themeRelId, RelationshipType.Theme, "theme/theme1.xml"));
    return rels;
}

export async function toBytes(slides: ReadonlyArray<SlideInput>): Promise<Uint8Array> {
    return pack(toParts(slides));
}
