import { exportHtml } from "#/export/html";
import { exportPdf } from "#/export/pdf";
import { exportPptx } from "#/export/pptx";
import { ExportFormat } from "#/export/format";
import type { ExportContext } from "#/export/context";

export { fromBase64, readBlob } from "#/export/assets";
export { finalizeSlides } from "#/export/html/animations";
export { ExportFormat };
export type { ExportContext } from "#/export/context";

export async function exportDeck(format: ExportFormat, context: ExportContext): Promise<void> {
    switch (format) {
        case ExportFormat.Pdf:
            exportPdf(context);
            return;
        case ExportFormat.HtmlLinked:
            await exportHtml(context, false);
            return;
        case ExportFormat.Html:
            await exportHtml(context, true);
            return;
        case ExportFormat.Pptx:
            await exportPptx(context);
            return;
    }
}
