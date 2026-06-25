import { button, div, styled } from "#/dom";
import { ExportFormat } from "#/export/format";
import { declaration, rule } from "@dropdeck/html/css";

const MENU = [
    { format: ExportFormat.Pdf, label: "PDF" },
    { format: ExportFormat.Pptx, label: "PowerPoint" },
    { format: ExportFormat.Html, label: "HTML (offline)" },
    { format: ExportFormat.HtmlLinked, label: "HTML (online)" }
] as const;

export const exportBarCss = [
    rule(["#exportBar"], [
        declaration("position", "fixed"),
        declaration("top", "0.875rem"),
        declaration("right", "1rem"),
        declaration("z-index", "120"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("align-items", "flex-end"),
        declaration("gap", "0.5rem"),
        declaration("font-family", "var(--font-body)")
    ]),
    rule(["#exportBar.hidden"], [declaration("display", "none")]),
    rule([".export-toggle"], [declaration("position", "relative")]),
    rule(["#exportToggle", "#editorToggle"], [
        declaration("border", "0.0625rem solid var(--surface-border)"),
        declaration("background", "var(--surface)"),
        declaration("color", "var(--color-text)"),
        declaration("border-radius", "2rem"),
        declaration("padding", "0.4375rem 1rem"),
        declaration("font-size", "0.85rem"),
        declaration("font-weight", "700"),
        declaration("cursor", "pointer"),
        declaration("box-shadow", "0 0.5rem 1.5rem rgba(0, 0, 0, 0.18)")
    ]),
    rule(["#exportToggle:disabled"], [declaration("opacity", "0.6"), declaration("cursor", "default")]),
    rule(["#exportMenu"], [
        declaration("position", "absolute"),
        declaration("top", "calc(100% + 0.5rem)"),
        declaration("right", "0"),
        declaration("min-width", "10.5rem"),
        declaration("display", "flex"),
        declaration("flex-direction", "column"),
        declaration("gap", "0.125rem"),
        declaration("padding", "0.375rem"),
        declaration("background", "var(--surface)"),
        declaration("border", "0.0625rem solid var(--surface-border)"),
        declaration("border-radius", "0.75rem"),
        declaration("box-shadow", "0 1rem 2.5rem rgba(0, 0, 0, 0.28)")
    ]),
    rule(["#exportMenu.hidden"], [declaration("display", "none")]),
    rule(["#exportMenu button"], [
        declaration("text-align", "left"),
        declaration("border", "none"),
        declaration("background", "transparent"),
        declaration("color", "var(--color-text)"),
        declaration("padding", "0.5rem 0.75rem"),
        declaration("border-radius", "0.5rem"),
        declaration("font-size", "0.85rem"),
        declaration("cursor", "pointer")
    ]),
    rule(["#exportMenu button:hover"], [
        declaration("background", "rgba(var(--accent1-rgb), 0.14)"),
        declaration("color", "var(--color-accent-1)")
    ])
] as const;

const exportBar = styled(
    div(
        { id: "exportBar", class: "hidden" },
        div(
            { class: "export-toggle" },
            button({ type: "button", id: "exportToggle" }, "Export"),
            div(
                { id: "exportMenu", class: "hidden" },
                MENU.map((item) => button({ type: "button", data: { format: item.format } }, item.label))
            )
        ),
        button({ type: "button", id: "editorToggle" }, "Edit")
    ),
    exportBarCss
);

export function exportBarView(): typeof exportBar.tree {
    return exportBar.tree;
}
