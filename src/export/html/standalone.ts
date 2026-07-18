import presentRuntime from "virtual:present-runtime";
import { body, div, head, html, link, mapUrlAttrs, meta, script, serialize, style, title } from "#/dom";
import { CssNodeKind, declaration, descriptorValue, parse as parseCss, parseStyle, parseUnicodeRange, serialize as serializeCss, unicodeRangeCovers } from "@dropdeck/html/css";
import { collectAssetDataUrls, collectInlinedFontCss, downloadText, slugify } from "#/export/assets";
import { deckSlideNodes } from "#/export/html/deck";
import type { DomNode } from "#/dom";
import type { ExportContext } from "#/export/context";
import type { AtRule, StyleNode } from "@dropdeck/html/css";

export async function exportHtml(context: ExportContext, offline: boolean): Promise<void> {
    const { deck, source, title: name } = context;
    const particlesOn = deck.config.particles !== "false";
    const assets = offline ? await collectAssetDataUrls(context.deckEl, context.assets) : context.assets;
    const slides = mapUrlAttrs(deckSlideNodes(deck, particlesOn), assets);
    const css = capturePageCss();
    const rootStyle = document.documentElement.getAttribute("style") ?? "";
    const fonts = offline ? [style({}, subsetFontCss(await collectInlinedFontCss(), `${rootStyle}\n${css}`, usedCodepoints(source)))] : fontLinkNodes();
    const markup = leanDocument(name, rootStyle, slides, css, fonts);
    downloadText(markup, `${slugify(name)}.html`, "text/html");
}

// A cross-origin sheet (Google Fonts) throws on rule access; its faces are inlined or linked separately, so
// skipping it loses nothing.
function capturePageCss(): string {
    let css = "";
    for (const sheet of pageSheets()) {
        try {
            for (const rule of Array.from(sheet.cssRules)) css += rule.cssText;
        } catch {
        }
    }
    return css;
}

// The Tailwind browser engine may publish its utilities through an adopted stylesheet rather than a `<style>`,
// so both lists are read to be sure the JIT output is captured.
function pageSheets(): Array<CSSStyleSheet> {
    const sheets: Array<CSSStyleSheet> = [];
    for (const sheet of Array.from(document.styleSheets)) sheets.push(sheet);
    for (const sheet of Array.from(document.adoptedStyleSheets)) sheets.push(sheet);
    return sheets;
}

// Keep the page's Google Fonts links so the browser refetches the fonts on open instead of carrying ~1 MB of
// inlined woff2.
function fontLinkNodes(): Array<DomNode> {
    const links = document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet'][href*='fonts.googleapis.com']");
    const nodes: Array<DomNode> = [];
    for (const element of Array.from(links)) nodes.push(link({ rel: "stylesheet", href: element.href }));
    return nodes;
}

function subsetFontCss(fontCss: string, used: string, codepoints: Set<number>): string {
    const usedLower = used.toLowerCase();
    const kept: Array<StyleNode> = [];
    for (const node of parseCss(fontCss)) {
        switch (node.kind) {
            case CssNodeKind.AtRule:
                if (node.name !== "@font-face" || faceWanted(node, usedLower, codepoints)) kept.push(node);
                break;
            case CssNodeKind.Declaration:
            case CssNodeKind.Rule:
                kept.push(node);
                break;
        }
    }

    return serializeCss(kept);
}

function faceWanted(face: AtRule, usedFamiliesLower: string, codepoints: Set<number>): boolean {
    const family = descriptorValue(face, "font-family");
    if (family !== null && !usedFamiliesLower.includes(unquote(family).toLowerCase())) return false;
    const range = descriptorValue(face, "unicode-range");
    if (range === null) return true;
    const ranges = parseUnicodeRange(range);
    if (ranges.length === 0) return true;
    for (const code of codepoints) if (unicodeRangeCovers(ranges, code)) return true;
    return false;
}

function unquote(value: string): string {
    return value.trim().replace(/^["']|["']$/g, "");
}

// The Markdown source is a safe superset of every glyph the slides render, so its code points bound the subset.
function usedCodepoints(text: string): Set<number> {
    const set = new Set<number>();
    for (const character of text) set.add(character.codePointAt(0) ?? 0);
    return set;
}

function headNodes(name: string, css: string, fonts: ReadonlyArray<DomNode>): Array<DomNode> {
    const nodes: Array<DomNode> = [
        meta({ charset: "UTF-8" }),
        meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
        title({}, name),
        style({}, css)
    ];
    for (const node of fonts) nodes.push(node);
    return nodes;
}

function leanDocument(
    name: string,
    rootStyle: string,
    slides: ReadonlyArray<DomNode>,
    css: string,
    fonts: ReadonlyArray<DomNode>
): string {
    // The theme lives in CSS variables on the document element plus a body background; carry both so the captured
    // stylesheet resolves against the same values.
    const bodyBg = document.body.style.background;
    const bodyStyle = bodyBg.length > 0 ? [declaration("background", bodyBg)] : [];
    const headNode = head({}, headNodes(name, css, fonts));
    const bodyNode = body(
        { style: bodyStyle },
        div({ class: "mouse-spotlight" }),
        div({ id: "stage" }, div({ class: "deck", id: "deck" }, slides)),
        script({}, presentRuntime)
    );
    // The mode defaults are captured with the stylesheet, keyed on `data-theme`; carry the dark attribute (light is
    // the `:root` default, so it needs none) so the exported page opens in the same palette.
    const rootDecls = parseStyle(rootStyle);
    const tree = document.documentElement.dataset.theme === "dark"
        ? html({ lang: "en", data: { theme: "dark" }, style: rootDecls }, headNode, bodyNode)
        : html({ lang: "en", style: rootDecls }, headNode, bodyNode);
    return `<!DOCTYPE html>\n${serialize(tree)}`;
}
