import { initAllParticles, pauseMedia, playSlide } from "#/animations";
import { DiagnosticSeverity, compile } from "#/front";
import { finalizeSlide } from "#/export/finalize";
import { renderDeckHtml } from "#/export/html";
import { query } from "#/host/dom";
import { applyConfig } from "#/theme";
import type { AssetMap, Deck } from "#/ir";

export type Presenter = ReturnType<typeof createPresenter>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- inferred from the returned object so `Presenter` cannot drift
export function createPresenter(deckEl: HTMLElement, dropEl: HTMLElement) {
    let current = 1;
    let total = 0;
    let markdown = "";
    let name = "deck";
    let compiled: Deck = { config: {}, slides: [] };
    let sidecars: AssetMap = new Map();

    function render(source: string, assets: AssetMap): void {
        const { deck, diagnostics } = compile(source);
        const error = diagnostics.find((diagnostic) => diagnostic.severity === DiagnosticSeverity.Error);
        if (error) {
            window.alert(error.message);
            return;
        }
        const theme = applyConfig(deck.config);
        markdown = source;
        name = deck.slides[0]?.title ?? "deck";
        compiled = deck;
        sidecars = assets;
        deckEl.innerHTML = renderDeckHtml(deck, theme.particlesOn, assets);
        total = deck.slides.length;
        current = 1;
        dropEl.classList.add("hidden");
        initAllParticles(theme.particleRgb);
        const active = query(deckEl, ".slide.active");
        if (active) playSlide(active);
    }

    // Reveal a slide without its entrance animation, clamped into range. The editor calls this as the cursor
    // crosses slide boundaries, so the preview follows the part of the markdown being edited.
    function show(atSlide: number): void {
        let next = atSlide;
        if (next < 1) next = 1;
        if (next > total) next = total;
        const target = query(deckEl, `.slide[data-slide="${next}"]`);
        if (!target) return;
        const shown = query(deckEl, ".slide.active");
        if (shown && shown !== target) shown.classList.remove("active");
        target.classList.add("active");
        finalizeSlide(target);
        current = next;
    }

    // Re-render for the live editor: a transient parse error is returned for inline display rather than
    // alerting, and entrance animations are skipped so a keystroke is instant. `atSlide` follows the cursor.
    function update(source: string, atSlide?: number): string | null {
        const { deck, diagnostics } = compile(source);
        const error = diagnostics.find((diagnostic) => diagnostic.severity === DiagnosticSeverity.Error);
        if (error) return error.message;
        const theme = applyConfig(deck.config);
        markdown = source;
        name = deck.slides[0]?.title ?? "deck";
        compiled = deck;
        total = deck.slides.length;
        deckEl.innerHTML = renderDeckHtml(deck, theme.particlesOn, sidecars);
        initAllParticles(theme.particleRgb);
        show(atSlide ?? current);
        return null;
    }

    function go(target: number): void {
        if (target < 1 || target > total) return;
        const previous = query(deckEl, ".slide.active");
        const next = query(deckEl, `.slide[data-slide="${target}"]`);
        if (previous) {
            previous.classList.remove("active");
            pauseMedia(previous);
        }
        if (next) {
            next.classList.add("active");
            playSlide(next);
        }
        current = target;
    }

    function change(direction: number): void {
        let target = current + direction;
        if (target < 1) target = total;
        if (target > total) target = 1;
        go(target);
    }

    return {
        element: deckEl,
        render,
        update,
        show,
        go,
        change,
        get index(): number {
            return current;
        },
        get isOpen(): boolean {
            return dropEl.classList.contains("hidden");
        },
        get source(): string {
            return markdown;
        },
        get title(): string {
            return name;
        },
        get deck(): Deck {
            return compiled;
        },
        get assets(): AssetMap {
            return sidecars;
        }
    };
}
