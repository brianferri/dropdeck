import { atRule, declaration, rule } from "@dropdeck/html/css";

export const ambientStyle = [
    atRule("@keyframes", "float", [
        rule(["0%", "100%"], [declaration("transform", "translateY(0)")]),
        rule(["50%"], [declaration("transform", "translateY(-12px)")])
    ]),
    rule([".reveal"], [
        declaration("opacity", "0"),
        declaration("transform", "translateY(20px)")
    ]),
    rule([".gradient-mesh"], [
        declaration("position", "absolute"),
        declaration("inset", "0"),
        declaration("z-index", "0"),
        declaration("overflow", "hidden"),
        declaration("pointer-events", "none")
    ]),
    rule([".blob"], [
        declaration("position", "absolute"),
        declaration("border-radius", "999px"),
        declaration("filter", "blur(80px)"),
        declaration("animation", "float-slow 16s ease-in-out infinite")
    ]),
    rule([".blob:nth-child(2)"], [declaration("animation-duration", "19s")]),
    rule([".blob:nth-child(3)"], [declaration("animation-duration", "22s")]),
    atRule("@keyframes", "float-slow", [
        rule(["0%", "100%"], [declaration("transform", "translate(0, 0) scale(1)")]),
        rule(["50%"], [declaration("transform", "translate(30px, -35px) scale(1.08)")])
    ]),
    rule([".slide::after"], [
        declaration("content", "''"),
        declaration("position", "absolute"),
        declaration("inset", "0"),
        declaration("z-index", "1"),
        declaration("pointer-events", "none"),
        declaration("background", "radial-gradient(ellipse at center, transparent 56%, rgba(15, 23, 42, 0.05) 100%)")
    ]),
    rule([".particle-canvas"], [
        declaration("position", "absolute"),
        declaration("inset", "0"),
        declaration("z-index", "0"),
        declaration("width", "100%"),
        declaration("height", "100%"),
        declaration("pointer-events", "none")
    ])
] as const;
