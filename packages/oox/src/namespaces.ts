// The ECMA-376 namespace URIs every OOXML document draws on. Prefix bindings (xmlns:a, xmlns:p, ...) are each
// format's own declaration and stay with its builders; only the URIs are shared vocabulary.
export enum Namespace {
    ContentTypes = "http://schemas.openxmlformats.org/package/2006/content-types",
    PackageRelationships = "http://schemas.openxmlformats.org/package/2006/relationships",
    OfficeRelationships = "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    DrawingML = "http://schemas.openxmlformats.org/drawingml/2006/main",
    Chart = "http://schemas.openxmlformats.org/drawingml/2006/chart",
    PresentationML = "http://schemas.openxmlformats.org/presentationml/2006/main",
    SpreadsheetML = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
}

export type QName<Prefix extends string, Local extends string> = `${Prefix}:${Local}`;
export type ParseQName<Q extends string> = Q extends `${infer Prefix}:${infer Local}`
    ? { readonly prefix: Prefix, readonly local: Local }
    : never;
