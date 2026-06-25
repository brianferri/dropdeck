/**
 * Entrance animations only run for the slide the viewer lands on, so an export capturing all slides at once would
 * otherwise show empty bars and zeroed counters.
 */
export function finalizeSlides(deckEl: HTMLElement): void {
    deckEl.querySelectorAll<HTMLElement>(".slide").forEach(finalizeSlide);
}

// Reveal one slide's entrance elements instantly. The live editor finalizes only the slide it is showing, so a
// keystroke updates without replaying the 0.5s reveals, while other slides still animate when navigated to.
export function finalizeSlide(slide: HTMLElement): void {
    finalizeReveals(slide);
    finalizeBars(slide);
    finalizeCounters(slide);
}

function finalizeReveals(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLElement>(".reveal").forEach((element) => {
        element.style.transition = "none";
        element.style.opacity = "1";
        element.style.transform = "none";
    });
}

function finalizeBars(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLElement>(".bar-fill").forEach((bar) => {
        bar.style.transition = "none";
        bar.style.width = `${bar.dataset.width ?? "0"}%`;
    });
}

function finalizeCounters(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLElement>("[data-count]").forEach((counter) => {
        counter.textContent = counter.dataset.count ?? counter.textContent;
    });
}
