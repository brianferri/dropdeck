export function playMedia(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLMediaElement>("video,audio").forEach((m) => {
        try {
            m.currentTime = 0;
            m.play().catch(() => undefined);
        } catch {
        }
    });
}

export function pauseMedia(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLMediaElement>("video,audio").forEach((m) => {
        try {
            m.pause();
        } catch {
        }
    });
}
