export function countUp(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseInt(el.dataset.count ?? "", 10);
        if (Number.isNaN(target)) return;
        let cur = 0;
        const step = target / 26;
        const timer = setInterval(() => {
            cur += step;
            if (cur >= target) {
                cur = target;
                clearInterval(timer);
            }
            el.textContent = String(Math.round(cur));
        }, 32);
    });
}
