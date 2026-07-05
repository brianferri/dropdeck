import { blob, ellipse } from "#/export/pptx/build";
import type { Palette } from "#/export/pptx/palette";
import type { Node } from "@dropdeck/pptx";

// A seeded generator so the scatter is deterministic across exports (Math.random is not).
function makeRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = ((state * 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

// Radii run larger than the CSS blobs because the radial fade concentrates colour at the centre.
export function meshShapes(nextId: () => number, palette: Palette): Array<Node> {
    return [
        blob(nextId, "blob:0", 1200, 20, 360, palette.accent2, 22),
        blob(nextId, "blob:1", 60, 700, 300, palette.accent1, 18),
        blob(nextId, "blob:2", 330, 380, 220, palette.accent3, 13)
    ];
}

export function particleShapes(nextId: () => number, palette: Palette): Array<Node> {
    const random = makeRandom(0x9e3779b9);
    const dots: Array<Node> = [];
    for (let index = 0; index < 48; index += 1) {
        const x = random() * 1280;
        const y = random() * 720;
        const radius = 1.4 + (random() * 1.8);
        const opacity = 8 + (random() * 16);
        dots.push(ellipse(nextId, `dot:${index}`, x, y, radius, palette.accent1, opacity));
    }
    return dots;
}
