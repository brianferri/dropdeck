import { growBars } from "#/animations/bars";
import { countUp } from "#/animations/count";
import { playMedia } from "#/animations/media";
import { revealEntrance } from "#/animations/reveal";

export { pauseMedia } from "#/animations/media";
export { initAllParticles } from "#/animations/particles";

export function playSlide(slide: HTMLElement): void {
    revealEntrance(slide);
    growBars(slide);
    countUp(slide);
    playMedia(slide);
}
