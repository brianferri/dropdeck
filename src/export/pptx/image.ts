export type ResolvedImage = {
    bytes: Uint8Array,
    extension: string,
    contentType: string,
    width: number,
    height: number
};

function decodeBase64(text: string): Uint8Array {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
}

function pngSize(bytes: Uint8Array): { width: number, height: number } | null {
    if (bytes.length < 24) return null;
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegSize(bytes: Uint8Array): { width: number, height: number } | null {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 2;
    while (offset + 9 < bytes.length) {
        if (view.getUint8(offset) !== 0xff) return null;
        const marker = view.getUint8(offset + 1);
        if (marker >= 0xc0 && marker <= 0xc3) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
        offset += 2 + view.getUint16(offset + 2);
    }
    return null;
}

export function resolveImage(url: string): ResolvedImage | null {
    const match = (/^data:(image\/(png|jpeg|jpg|gif));base64,(.+)$/i).exec(url.trim());
    if (!match) return null;
    const kind = match[2].toLowerCase();
    const extension = kind === "jpeg" ? "jpg" : kind;
    const bytes = decodeBase64(match[3]);
    const size = extension === "png" ? pngSize(bytes) : jpegSize(bytes);
    if (!size) return null;
    return { bytes, extension, contentType: match[1], width: size.width, height: size.height };
}
