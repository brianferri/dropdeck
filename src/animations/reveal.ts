export function revealEntrance(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLElement>(".reveal").forEach((el, i) => {
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.transform = "translateY(18px)";
        el.getBoundingClientRect();
        const delay = i * 0.07;
        el.style.transition = `opacity .42s ease ${delay}s, transform .42s ease ${delay}s`;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
    });
}
