import { imageToPngDataUrl } from "#/export/rasterize";
import type { AssetMap } from "#/ir";

// btoa only handles Latin-1, so encode to bytes first.
export function toBase64(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

export function fromBase64(encoded: string): string {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder().decode(bytes);
}

export function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "deck";
}

export function downloadText(text: string, filename: string, mime: string): void {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
    // Copy into a fresh, ArrayBuffer-backed view: a plain Uint8Array may be SharedArrayBuffer-backed, which Blob's
    // BlobPart type rejects.
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
}

export function triggerDownload(href: string, filename: string): void {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
}

export async function readBlob(blob: Blob, kind: "text" | "dataURL"): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (): void => { resolve(typeof reader.result === "string" ? reader.result : ""); };
        reader.onerror = (): void => { reject(reader.error ?? new Error("read failed")); };
        if (kind === "text") reader.readAsText(blob);
        else reader.readAsDataURL(blob);
    });
}

async function fetchAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url, { mode: "cors" });
    return readBlob(await response.blob(), "dataURL");
}

function renderedImagesBySrc(deckEl: HTMLElement): Map<string, HTMLImageElement> {
    const images = new Map<string, HTMLImageElement>();
    deckEl.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src) images.set(src, img);
    });
    return images;
}

function isRemote(url: string): boolean {
    return url.startsWith("//") || url.startsWith("http");
}

// Read URLs off the rendered DOM, not the Markdown, so a path shown inside a code sample is not treated as an asset.
function deckAssetUrls(deckEl: HTMLElement): Array<string> {
    const urls = new Set<string>();
    deckEl.querySelectorAll<HTMLElement>("[src], [poster]").forEach((element) => {
        for (const url of [element.getAttribute("src"), element.getAttribute("poster")]) if (url) urls.add(url);
    });
    return Array.from(urls);
}

export async function collectAssetDataUrls(deckEl: HTMLElement, assets: AssetMap): Promise<Map<string, string>> {
    const rendered = renderedImagesBySrc(deckEl);
    const dataUrls = new Map<string, string>();

    await Promise.all(Array.from(assets).map(async ([key, url]) => {
        const data = await assetToDataUrl(url, rendered.get(url));
        if (data) dataUrls.set(key, data);
    }));

    // Remote images render with their URL as the src, so inline each under that URL for a network-free file.
    await Promise.all(deckAssetUrls(deckEl).map(async (url) => {
        if (!isRemote(url)) return;
        const data = await assetToDataUrl(url, rendered.get(url));
        if (data) dataUrls.set(url, data);
    }));
    return dataUrls;
}

async function assetToDataUrl(url: string, rendered: HTMLImageElement | undefined): Promise<string | null> {
    try {
        return await fetchAsDataUrl(new URL(url, document.baseURI).href);
    } catch {
        // fetch is blocked for file:// and uncorsed cross-origin; fall back to the rendered image below.
    }
    if (rendered && rendered.complete && rendered.naturalWidth > 0) {
        try {
            return imageToPngDataUrl(rendered);
        } catch {
            // The canvas is tainted by a cross-origin image; this one can't be read.
        }
    }
    return null;
}

// Fetching from the page's own User-Agent yields the modern woff2 the browser already uses.
export async function collectInlinedFontCss(): Promise<string> {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet'][href*='fonts.googleapis.com']"));
    const sheets = await Promise.all(links.map(async (link) => {
        try {
            return await inlineFontFileUrls(await (await fetch(link.href)).text());
        } catch {
            return "";
        }
    }));
    return sheets.join("");
}

async function inlineFontFileUrls(cssText: string): Promise<string> {
    const urls = new Set<string>();
    for (const match of cssText.matchAll(/url\((https:\/\/[^)]+)\)/g)) if (match[1]) urls.add(match[1]);

    const urlList = Array.from(urls);
    const datas = await Promise.all(urlList.map(async (url) => {
        try {
            return await fetchAsDataUrl(url);
        } catch {
            return null;
        }
    }));
    let inlined = cssText;
    urlList.forEach((url, index) => {
        const data = datas[index];
        if (data !== null) inlined = inlined.split(url).join(data);
    });
    return inlined;
}

export function applyInlinedFonts(root: HTMLElement, fontCss: string): void {
    root.querySelectorAll("link[href*='fonts.googleapis.com'], link[href*='fonts.gstatic.com'], link[rel='preconnect']").forEach((link) => {
        link.remove();
    });
    if (fontCss === "") return;
    const style = document.createElement("style");
    style.dataset.inlinedFonts = "true";
    style.textContent = fontCss;
    root.querySelector("head")?.appendChild(style);
}
