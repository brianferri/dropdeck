import { div, styled } from "#/dom";
import { declaration, rule } from "@dropdeck/html/css";

const C = { spotlight: "mouse-spotlight" } as const;

export const spotlightCss = [
    rule([`.${C.spotlight}`], [
        declaration("position", "fixed"),
        declaration("inset", "0"),
        declaration("z-index", "99"),
        declaration("pointer-events", "none")
    ])
] as const;

const spotlight = styled(div({ class: C.spotlight }), spotlightCss);

export function spotlightView(): typeof spotlight.tree {
    return spotlight.tree;
}
