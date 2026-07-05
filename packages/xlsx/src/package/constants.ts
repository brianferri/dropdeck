const SML = "application/vnd.openxmlformats-officedocument.spreadsheetml";
const OFFICE = "application/vnd.openxmlformats-officedocument";
const PACKAGE = "application/vnd.openxmlformats-package";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";

export const ContentType = {
    Relationships: `${PACKAGE}.relationships+xml`,
    Xml: "application/xml",
    Workbook: `${SML}.sheet.main+xml`,
    Worksheet: `${SML}.worksheet+xml`,
    Styles: `${SML}.styles+xml`,
    SharedStrings: `${SML}.sharedStrings+xml`,
    Table: `${SML}.table+xml`,
    Chartsheet: `${SML}.chartsheet+xml`,
    Theme: `${OFFICE}.theme+xml`,
    CoreProperties: `${PACKAGE}.core-properties+xml`,
    ExtendedProperties: `${OFFICE}.extended-properties+xml`
} as const satisfies Record<string, string>;

export const RelationshipType = {
    OfficeDocument: `${REL}/officeDocument`,
    Worksheet: `${REL}/worksheet`,
    Styles: `${REL}/styles`,
    SharedStrings: `${REL}/sharedStrings`,
    Table: `${REL}/table`,
    Chartsheet: `${REL}/chartsheet`,
    Theme: `${REL}/theme`,
    ExtendedProperties: `${REL}/extended-properties`,
    CoreProperties: `${PKG_REL}/metadata/core-properties`
} as const satisfies Record<string, string>;
