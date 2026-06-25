import type { ExportFormat } from "#/export";
import { exportDeck, finalizeSlides } from "#/export";
import type { Presenter } from "#/presenter";

export function revealExportBar(): void {
    document.getElementById("exportBar")?.classList.remove("hidden");
}

// Finalise every slide before any print, so off-screen bars and counters aren't blank on the page.
export function mountExportBar(presenter: Presenter): void {
    window.addEventListener("beforeprint", () => { finalizeSlides(presenter.element); });

    const menu = document.getElementById("exportMenu");
    const toggle = document.getElementById("exportToggle") as HTMLButtonElement | null;
    if (!menu || !toggle) return;

    toggle.addEventListener("click", () => menu.classList.toggle("hidden"));
    menu.querySelectorAll<HTMLButtonElement>("button[data-format]").forEach((button) => {
        button.addEventListener("click", () => {
            runExport(presenter, button.dataset.format ?? "", menu, toggle).catch(() => undefined);
        });
    });
}

function restoreToggle(toggle: HTMLButtonElement, label: string | null): void {
    toggle.textContent = label;
    toggle.disabled = false;
}

async function runExport(presenter: Presenter, format: string, menu: HTMLElement, toggle: HTMLButtonElement): Promise<void> {
    menu.classList.add("hidden");
    const label = toggle.textContent;
    toggle.textContent = "Exporting...";
    toggle.disabled = true;
    try {
        await exportDeck(format as ExportFormat, {
            deck: presenter.deck,
            deckEl: presenter.element,
            source: presenter.source,
            title: presenter.title,
            assets: presenter.assets
        });
    } catch (error) {
        window.alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        restoreToggle(toggle, label);
    }
}
