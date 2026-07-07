// @vitest-environment happy-dom
import { test, expect, beforeEach } from "vitest";
import { createPresenter } from "#/presenter";
import { mountExportBar, revealExportBar } from "#/host/export-bar";

beforeEach(() => { document.body.innerHTML = ""; });

function presenter(): ReturnType<typeof createPresenter> {
    return createPresenter(document.createElement("div"), document.createElement("div"));
}

test("revealExportBar drops the hidden class from the bar", () => {
    const bar = document.createElement("div");
    bar.id = "exportBar";
    bar.classList.add("hidden");
    document.body.appendChild(bar);
    revealExportBar();
    expect(bar.classList.contains("hidden")).toBe(false);
});

test("the export toggle shows and hides the format menu", () => {
    document.body.innerHTML = "<div id=\"exportMenu\" class=\"hidden\"></div><button id=\"exportToggle\"></button>";
    mountExportBar(presenter());
    const menu = document.getElementById("exportMenu");
    const toggle = document.getElementById("exportToggle");
    toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(menu?.classList.contains("hidden")).toBe(false);
    toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(menu?.classList.contains("hidden")).toBe(true);
});

test("mountExportBar is inert when the menu markup is absent", () => {
    expect(() => { mountExportBar(presenter()); }).not.toThrow();
});
