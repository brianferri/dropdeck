import { finalizeSlides } from "#/export/finalize";
import type { ExportContext } from "#/export/context";

// Slide colours render only if the user enables background graphics in the print dialog.
export function exportPdf(context: ExportContext): void {
    finalizeSlides(context.deckEl);
    window.print();
}
