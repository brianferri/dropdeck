// @vitest-environment happy-dom
import { test, expect } from "vitest";
import { basenameOf, directoryOf, isMarkdown, pickerFiles, relativeTo } from "#/host/assets";

test("basenameOf returns the last path segment, or the whole string when unpathed", () => {
    expect(basenameOf("a/b/deck.md")).toBe("deck.md");
    expect(basenameOf("deck.md")).toBe("deck.md");
    expect(basenameOf("a/b/")).toBe("");
});

test("isMarkdown recognises the markdown extensions case-insensitively and rejects others", () => {
    expect(isMarkdown("deck.md")).toBe(true);
    expect(isMarkdown("DECK.MARKDOWN")).toBe(true);
    expect(isMarkdown("notes.mkd")).toBe(true);
    expect(isMarkdown("image.png")).toBe(false);
    expect(isMarkdown("noextension")).toBe(false);
});

test("directoryOf drops a leading slash and returns the parent, empty at the root", () => {
    expect(directoryOf("/deck/slides/one.md")).toBe("deck/slides");
    expect(directoryOf("deck.md")).toBe("");
    expect(directoryOf("/deck.md")).toBe("");
});

test("relativeTo strips the directory prefix, leaving paths outside it untouched", () => {
    expect(relativeTo("/deck/img/a.png", "deck")).toBe("img/a.png");
    expect(relativeTo("deck/a.png", "")).toBe("deck/a.png");
    expect(relativeTo("other/a.png", "deck")).toBe("other/a.png");
});

test("pickerFiles keeps the webkitRelativePath when present, falling back to the bare name", () => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["#"], "loose.md"));
    const picked = pickerFiles(transfer.files);
    expect(picked.length).toBe(1);
    expect(picked[0].path).toBe("loose.md");
});
