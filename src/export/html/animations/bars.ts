export function growBars(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLElement>(".bar-fill").forEach((bar, i) => {
        bar.style.transition = "none";
        bar.style.width = "0";
        bar.getBoundingClientRect();
        bar.style.transition = `width .7s cubic-bezier(.22,1,.36,1) ${(i * 0.12) + 0.2}s`;
        const width = bar.dataset.width ?? "0";
        setTimeout(() => {
            bar.style.width = `${width}%`;
        }, 40);
    });
}
