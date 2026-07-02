import { declaration, rule } from "@dropdeck/html/css";
import { revealRise } from "#/export/html/animations/css";

// `.slide.instant` drops the slide cross-fade during a morph swap so the matched element's glide is the only motion.
export const animationStyle = [
    rule(["[data-animation=\"reveal\"]"], [
        declaration("opacity", "0"),
        // The individual `translate` property, not `transform`, so the rise composes with an image's own transform
        // (the position the deck placed it at) instead of overwriting it.
        declaration("translate", revealRise())
    ]),
    rule([".slide.instant"], [declaration("transition", "none")])
];
