/**
 * Draw an already-loaded image source onto a canvas at a pixel size and read it back as a PNG data URI.
 * @throws {Error} when there is no 2D context, or the canvas is cross-origin tainted and cannot be exported.
 */
function canvasToPng(source: CanvasImageSource, width: number, height: number): string {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("no 2d context");
    context.drawImage(source, 0, 0, width, height);
    return canvas.toDataURL("image/png");
}

/**
 * A rendered `<img>` baked to a PNG at its natural size; the offline HTML export uses this when a fetch is blocked.
 * @throws {Error} when the source image is cross-origin tainted and the canvas cannot be exported.
 */
export function imageToPngDataUrl(image: HTMLImageElement): string {
    return canvasToPng(image, image.naturalWidth, image.naturalHeight);
}

/**
 * Rasterise an SVG document to a PNG data URI at the target pixel size. PowerPoint cannot embed SVG, so vector
 * charts and icons are baked to a PNG before lowering. The markup should carry a `viewBox`; the raster resolution
 * is the size passed in (render at 2x the placed size for a crisp result).
 * @throws {Error} when the SVG fails to load (malformed markup) or the canvas cannot be exported.
 */
export async function svgToPngDataUrl(markup: string, width: number, height: number): Promise<string> {
    const image = new Image(width, height);
    await new Promise<void>((resolve, reject) => {
        image.addEventListener("load", () => { resolve(); });
        image.addEventListener("error", () => { reject(new Error("SVG failed to rasterise")); });
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    });
    return canvasToPng(image, width, height);
}
