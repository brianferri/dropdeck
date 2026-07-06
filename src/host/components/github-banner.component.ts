import { a, div, span, styled } from "#/dom";
import { path, svg } from "@dropdeck/xml/svg";
import { cssVar, declaration, rule } from "@dropdeck/html/css";

const REPO_URL = "https://github.com/brianferri/dropdeck";

// GitHub's octicon mark, drawn in a 16x16 box and filled with the link's text colour. Single path data token.
// eslint-disable-next-line @stylistic/max-len
const MARK_PATH = "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z";

export const githubBannerCss = [
    rule([".gh-banner"], [
        declaration("position", "fixed"),
        declaration("top", "18px"),
        declaration("right", "20px"),
        declaration("z-index", "100"),
        declaration("display", "inline-flex"),
        declaration("align-items", "center"),
        declaration("gap", "0.5rem"),
        declaration("padding", "0.5rem 0.95rem"),
        declaration("border-radius", "999px"),
        declaration("background", cssVar("--surface")),
        declaration("border", `1px solid ${cssVar("--surface-border")}`),
        declaration("box-shadow", "0 10px 24px rgba(15, 23, 42, 0.12)"),
        declaration("color", cssVar("--color-text")),
        declaration("font-family", cssVar("--font-body")),
        declaration("font-size", "0.85rem"),
        declaration("font-weight", "600"),
        declaration("text-decoration", "none"),
        declaration("transition", "transform 0.18s ease, border-color 0.18s ease")
    ]),
    rule([".gh-banner:hover"], [
        declaration("transform", "translateY(-1px)"),
        declaration("border-color", cssVar("--color-accent-1"))
    ]),
    rule([".gh-banner .gh-mark"], [
        declaration("width", "18px"),
        declaration("height", "18px"),
        declaration("fill", "currentColor")
    ]),
    // The doodle sits below-left of the pill and curves up into it; `pointer-events:none` keeps it off the link.
    rule([".gh-arrow"], [
        declaration("position", "fixed"),
        declaration("top", "48px"),
        declaration("right", "112px"),
        declaration("z-index", "100"),
        declaration("width", "88px"),
        declaration("height", "auto"),
        declaration("color", cssVar("--color-accent-1")),
        declaration("pointer-events", "none")
    ])
] as const;

const githubBanner = styled(div(
    {},
    svg(
        [["class", "gh-arrow"], ["viewBox", "0 0 110 80"], ["fill", "none"]],
        path([["d", "M8 74 C 34 66, 74 72, 98 18"], ["stroke", "currentColor"], ["stroke-width", "3"], ["stroke-linecap", "round"]]),
        path([["d", "M85 26 L 99 15 L 101 33"], ["stroke", "currentColor"], ["stroke-width", "3"], ["stroke-linecap", "round"], ["stroke-linejoin", "round"]])
    ),
    a(
        {
            class: "gh-banner",
            href: REPO_URL,
            target: "_blank",
            rel: "noopener noreferrer"
        },
        svg(
            [["class", "gh-mark"], ["viewBox", "0 0 16 16"]],
            path([["d", MARK_PATH]])
        ),
        span({}, "Source")
    )
), githubBannerCss);

export function githubBannerView(): typeof githubBanner.tree {
    return githubBanner.tree;
}
