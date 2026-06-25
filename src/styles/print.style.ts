import { atRule, declaration, rule } from "@dropdeck/html/css";

export const printStyle = [
    atRule("@media", "print", [
        atRule("@page", "", [
            declaration("size", "1180px 663.75px"),
            declaration("margin", "0")
        ]),
        rule(["html", "body"], [
            declaration("width", "auto"),
            declaration("height", "auto"),
            declaration("overflow", "visible"),
            declaration("background", "var(--color-bg)")
        ]),
        rule(["#drop", "#exportBar", ".mouse-spotlight"], [declaration("display", "none")]),
        rule(["#stage .gradient-mesh", "#stage .particle-canvas", "#stage .blob", "#stage .slide::after"], [declaration("display", "none")]),
        rule(["#stage"], [
            declaration("position", "static"),
            declaration("transform", "none")
        ]),
        rule(["#stage .deck"], [
            declaration("width", "1180px"),
            declaration("height", "auto")
        ]),
        rule(["#stage .slide"], [
            declaration("position", "relative"),
            declaration("inset", "auto"),
            declaration("width", "1180px"),
            declaration("height", "663.75px"),
            declaration("overflow", "hidden"),
            declaration("break-after", "page"),
            declaration("page-break-after", "always"),
            declaration("-webkit-print-color-adjust", "exact"),
            declaration("print-color-adjust", "exact")
        ]),
        rule(["#stage .slide:last-child"], [
            declaration("break-after", "auto"),
            declaration("page-break-after", "auto")
        ]),
        rule(["#stage .slide > .content"], [
            declaration("max-height", "none"),
            declaration("overflow", "visible")
        ]),
        rule(["#stage .slide", "#stage .slide *"], [
            declaration("opacity", "1"),
            declaration("transform", "none"),
            declaration("filter", "none"),
            declaration("animation", "none"),
            declaration("mix-blend-mode", "normal")
        ])
    ])
] as const;
