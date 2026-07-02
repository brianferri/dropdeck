// Bundled to an IIFE and inlined into the exported artifact, which is why it may import only the animations.

import { initAllParticles, playSlide, transitionTo } from "#/export/html/animations";

const SWIPE_THRESHOLD = 50;

function accentRgb(): string {
    const rgb = getComputedStyle(document.documentElement).getPropertyValue("--accent1-rgb").trim();
    return rgb.length > 0 ? rgb : "15,118,110";
}

function wireNavigation(go: (direction: number) => void): void {
    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
            event.preventDefault();
            go(1);
        }
        if (event.key === "ArrowLeft" || event.key === "PageUp") {
            event.preventDefault();
            go(-1);
        }
    });
    window.addEventListener("click", (event) => {
        go(event.clientX > window.innerWidth / 2 ? 1 : -1);
    });
    let touchStartX = 0;
    window.addEventListener("touchstart", (event) => {
        touchStartX = event.touches[0].clientX;
    });
    window.addEventListener("touchend", (event) => {
        const delta = touchStartX - event.changedTouches[0].clientX;
        if (Math.abs(delta) > SWIPE_THRESHOLD) go(delta > 0 ? 1 : -1);
    });
}

function present(): void {
    const deck = document.getElementById("deck");
    if (!deck) return;
    const slides = Array.from(deck.querySelectorAll<HTMLElement>(".slide"));
    if (slides.length === 0) return;

    let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));

    function go(direction: number): void {
        let next = current + direction;
        if (next < 0) next = slides.length - 1;
        if (next >= slides.length) next = 0;
        if (next === current) return;
        const previous = slides[current];
        current = next;
        transitionTo(previous, slides[current]);
    }

    initAllParticles(accentRgb());
    slides[current].classList.add("active");
    playSlide(slides[current]);
    wireNavigation(go);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", present);
else present();
