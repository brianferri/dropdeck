import { activeElement, requireElement } from "#/host/dom";
import type { Presenter } from "#/presenter";

const SWIPE_THRESHOLD = 50;

export function mountNavigation(
    deck: Presenter,
    stage: HTMLElement,
    spotlight: HTMLElement | null
): void {
    mountKeyboard(deck);
    mountPointer(deck, stage, spotlight);
    mountTouch(deck);
}

function mountKeyboard(deck: Presenter): void {
    document.addEventListener("keydown", (event) => {
        if (!deck.isOpen) return;
        const focused = activeElement();

        if (
            focused instanceof HTMLTextAreaElement ||
            focused instanceof HTMLInputElement
        ) return;

        if (
            event.key === "ArrowRight" ||
            event.key === " " ||
            event.key === "PageDown"
        ) {
            event.preventDefault();
            deck.change(1);
        }

        if (
            event.key === "ArrowLeft" ||
            event.key === "PageUp"
        ) {
            event.preventDefault();
            deck.change(-1);
        }
    });
}

function mountPointer(deck: Presenter, stage: HTMLElement, spotlight: HTMLElement | null): void {
    const dropEl = requireElement("drop");
    const exportBarEl = requireElement("exportBar");
    const editorEl = requireElement("editor");

    function isForward(clientX: number): boolean {
        const rect = stage.getBoundingClientRect();
        return clientX > rect.left + (rect.width / 2);
    }

    window.addEventListener("click", (event) => {
        if (!deck.isOpen) return;
        const target = event.target as Node | null;
        if (
            dropEl.contains(target) ||
            exportBarEl.contains(target) ||
            editorEl.contains(target)
        ) return;
        deck.change(isForward(event.clientX) ? 1 : -1);
    });
    window.addEventListener("mousemove", (event) => {
        if (deck.isOpen) {
            const right = isForward(event.clientX);
            stage.classList.toggle("nav-right", right);
            stage.classList.toggle("nav-left", !right);
        }
        if (spotlight) {
            spotlight.style.background =
                `radial-gradient(520px circle at ${event.clientX}px ${event.clientY}px, rgba(var(--accent2-rgb, 20,184,166), 0.07), transparent 40%)`;
        }
    });
}

function mountTouch(deck: Presenter): void {
    let touchStartX = 0;
    window.addEventListener("touchstart", (event) => {
        touchStartX = event.touches[0].clientX;
    });
    window.addEventListener("touchend", (event) => {
        const delta = touchStartX - event.changedTouches[0].clientX;
        if (Math.abs(delta) > SWIPE_THRESHOLD) deck.change(delta > 0 ? 1 : -1);
    });
}
