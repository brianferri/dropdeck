import { div, styled } from "#/dom";
import { declaration, rule } from "@dropdeck/html/css";

export const stageCss = [
    rule(["#stage"], [
        declaration("position", "fixed"),
        declaration("left", "calc(50% + var(--editor-width, 0px) / 2)"),
        declaration("top", "50%"),
        declaration("transform", "translate(-50%, -50%) scale(var(--scale, 1))"),
        declaration("transform-origin", "center center")
    ]),
    rule([".deck"], [
        declaration("width", "1180px"),
        declaration("height", "663.75px"),
        declaration("position", "relative")
    ]),
    rule(["#stage.nav-left"], [declaration("cursor", "w-resize")]),
    rule(["#stage.nav-right"], [declaration("cursor", "e-resize")])
] as const;

const stage = styled(
    div(
        { id: "stage" },
        div({ class: "deck", id: "deck" })
    ),
    stageCss,
    ["nav-left", "nav-right"]
);

export function stageView(): typeof stage.tree {
    return stage.tree;
}
