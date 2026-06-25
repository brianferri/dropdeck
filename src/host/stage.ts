const STAGE_WIDTH = 1180;
const STAGE_HEIGHT = 663.75;

export function mountStage(stage: HTMLElement): void {
    function fit(): void {
        const editor = document.getElementById("editor");
        const reserved = editor && !editor.classList.contains("hidden") ? editor.getBoundingClientRect().width : 0;
        const available = window.innerWidth - reserved;
        stage.style.setProperty("--scale", String(Math.min(available / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT)));
    }
    window.addEventListener("resize", fit);
    fit();
}
