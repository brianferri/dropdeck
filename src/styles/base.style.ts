import { declaration, rule } from "@dropdeck/html/css";

export const baseStyle = [
    rule(["*", "*::before", "*::after"], [declaration("box-sizing", "border-box")]),
    rule(["html", "body"], [
        declaration("background", "var(--color-bg)"),
        declaration("margin", "0")
    ]),
    rule(["body"], [
        declaration("font-family", "var(--font-body)"),
        declaration("color", "var(--color-text)"),
        declaration("overflow", "hidden"),
        declaration("height", "100vh"),
        declaration("width", "100vw")
    ])
] as const;
