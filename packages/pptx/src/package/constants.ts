const PML = "application/vnd.openxmlformats-officedocument.presentationml";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export const ContentType = {
    Relationships: "application/vnd.openxmlformats-package.relationships+xml",
    Xml: "application/xml",
    Presentation: `${PML}.presentation.main+xml`,
    PresProps: `${PML}.presProps+xml`,
    Slide: `${PML}.slide+xml`,
    SlideMaster: `${PML}.slideMaster+xml`,
    SlideLayout: `${PML}.slideLayout+xml`,
    Theme: "application/vnd.openxmlformats-officedocument.theme+xml",
    Chart: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
    Xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
} as const satisfies Record<string, string>;

export const RelationshipType = {
    OfficeDocument: `${REL}/officeDocument`,
    PresProps: `${REL}/presProps`,
    Slide: `${REL}/slide`,
    SlideMaster: `${REL}/slideMaster`,
    SlideLayout: `${REL}/slideLayout`,
    Theme: `${REL}/theme`,
    Image: `${REL}/image`,
    Chart: `${REL}/chart`,
    // The embedded workbook behind a chart is referenced as an OPC "package".
    Package: `${REL}/package`
} as const satisfies Record<string, string>;
