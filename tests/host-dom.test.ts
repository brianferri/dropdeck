// @vitest-environment happy-dom
import { test, expect, beforeEach } from "vitest";
import { mountStyle, query, requireElement, setRootProperty } from "#/host/dom";
import { stageCss } from "#/host/components/stage.component";

beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
});

test("requireElement returns the element by id and throws a named error when it is absent", () => {
    const node = document.createElement("div");
    node.id = "stage";
    document.body.appendChild(node);
    expect(requireElement("stage")).toBe(node);
    expect(() => requireElement("missing")).toThrow("dropdeck: missing #missing");
});

test("query returns the first match under the root, or null", () => {
    document.body.innerHTML = "<section><span class=\"tag\">a</span><span class=\"tag\">b</span></section>";
    const found = query(document.body, "span.tag");
    expect(found?.textContent).toBe("a");
    expect(query(document.body, "p.none")).toBe(null);
});

test("setRootProperty writes a custom property onto the document element", () => {
    setRootProperty("--accent", "#123456");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#123456");
});

test("mountStyle injects a style element once, ignoring a repeat of the same id", () => {
    mountStyle("dropdeck-stage", stageCss);
    mountStyle("dropdeck-stage", stageCss);
    const styles = document.head.querySelectorAll("style#dropdeck-stage");
    expect(styles.length).toBe(1);
    expect(String(styles[0].textContent).length).toBeGreaterThan(0);
});
