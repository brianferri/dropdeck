// Its own leaf so the export-bar can name these `data-format` values without pulling in the export pipeline's
// browser-only `virtual:present-runtime` import.
export enum ExportFormat {
    Pdf = "pdf",
    Html = "html",
    HtmlLinked = "html-linked",
    Pptx = "pptx"
}
