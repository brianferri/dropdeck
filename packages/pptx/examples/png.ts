import { deflateSync } from "node:zlib";

// A minimal PNG encoder, just enough to hand the deck a real raster the OOXML writer can embed. The package
// itself stays dependency-free; this lives under examples/ only, and leans on node:zlib for the IDAT stream.

const SIGNATURE = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

function crc32(bytes: Uint8Array): number {
    let remainder = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) {
        remainder ^= bytes[index];
        for (let bit = 0; bit < 8; bit += 1) {
            const carry = -(remainder & 1);
            remainder = (remainder >>> 1) ^ (0xedb88320 & carry);
        }
    }
    return (remainder ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: ReadonlyArray<Uint8Array>): Uint8Array {
    let size = 0;
    for (const part of parts) size += part.length;
    const out = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}

// A PNG chunk is length, four-character type, payload, then a CRC over type+payload.
function chunk(type: string, payload: Uint8Array): Uint8Array {
    const typeBytes = new TextEncoder().encode(type);
    const typed = concatBytes([typeBytes, payload]);
    const framed = new Uint8Array(typed.length + 8);
    const view = new DataView(framed.buffer);
    view.setUint32(0, payload.length);
    framed.set(typed, 4);
    view.setUint32(4 + typed.length, crc32(typed));
    return framed;
}

function header(size: number): Uint8Array {
    const data = new Uint8Array(13);
    const view = new DataView(data.buffer);
    view.setUint32(0, size);
    view.setUint32(4, size);
    data[8] = 8; // Eight bits per channel.
    data[9] = 2; // Truecolour RGB, no alpha.
    return data;
}

// A solid `size` x `size` RGB square. Each scanline carries a leading filter byte (0 = none) before its pixels.
export function solidPng(size: number, red: number, green: number, blue: number): Uint8Array {
    const stride = (size * 3) + 1;
    const raw = new Uint8Array(stride * size);
    for (let row = 0; row < size; row += 1) {
        for (let column = 0; column < size; column += 1) {
            const base = (row * stride) + 1 + (column * 3);
            raw[base] = red;
            raw[base + 1] = green;
            raw[base + 2] = blue;
        }
    }
    const idat = new Uint8Array(deflateSync(raw));
    return concatBytes([SIGNATURE, chunk("IHDR", header(size)), chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))]);
}
