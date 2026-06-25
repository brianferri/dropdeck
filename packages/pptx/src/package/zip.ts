export type ZipEntry = { path: string, bytes: Uint8Array };

// Magic values and the byte offsets used by the writers below are from PKWARE APPNOTE.TXT (.ZIP spec): sections
// 4.3.7 (local header), 4.3.12 (central header), 4.3.16 (end-of-central-directory), 4.4.5 (method 8 = deflate).
// https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
const SIGNATURE_LOCAL = 0x04034b50;
const SIGNATURE_CENTRAL = 0x02014b50;
const SIGNATURE_END = 0x06054b50;
const METHOD_DEFLATE = 8;
const VERSION_NEEDED = 20;
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_RECORD_SIZE = 22;

// CRC-32 must be taken over the uncompressed bytes, not the deflated output, per the ZIP format.
export async function buildZip(entries: ReadonlyArray<ZipEntry>): Promise<Uint8Array> {
    const prepared = await Promise.all(entries.map(async (entry) => ({
        name: encode(entry.path),
        crc: crc32(entry.bytes),
        compressed: await deflateRaw(entry.bytes),
        rawSize: entry.bytes.length
    })));
    const locals: Array<Uint8Array> = [];
    const centrals: Array<Uint8Array> = [];
    let offset = 0;
    for (const item of prepared) {
        locals.push(localHeader(item.name, item.crc, item.compressed.length, item.rawSize));
        locals.push(item.compressed);
        centrals.push(centralHeader(item.name, item.crc, item.compressed.length, item.rawSize, offset));
        offset += LOCAL_HEADER_SIZE + item.name.length + item.compressed.length;
    }
    const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
    centrals.push(endRecord(prepared.length, centralSize, offset));
    return concat([locals, centrals].flat());
}

function localHeader(name: Uint8Array, crc: number, sizeCompressed: number, sizeRaw: number): Uint8Array {
    const head = new DataView(new ArrayBuffer(LOCAL_HEADER_SIZE));
    head.setUint32(0, SIGNATURE_LOCAL, true);
    head.setUint16(4, VERSION_NEEDED, true);
    head.setUint16(8, METHOD_DEFLATE, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, sizeCompressed, true);
    head.setUint32(22, sizeRaw, true);
    head.setUint16(26, name.length, true);
    return concat([new Uint8Array(head.buffer), name]);
}

function centralHeader(name: Uint8Array, crc: number, sizeCompressed: number, sizeRaw: number, offset: number): Uint8Array {
    const head = new DataView(new ArrayBuffer(CENTRAL_HEADER_SIZE));
    head.setUint32(0, SIGNATURE_CENTRAL, true);
    head.setUint16(4, VERSION_NEEDED, true);
    head.setUint16(6, VERSION_NEEDED, true);
    head.setUint16(10, METHOD_DEFLATE, true);
    head.setUint32(16, crc, true);
    head.setUint32(20, sizeCompressed, true);
    head.setUint32(24, sizeRaw, true);
    head.setUint16(28, name.length, true);
    head.setUint32(42, offset, true);
    return concat([new Uint8Array(head.buffer), name]);
}

function endRecord(count: number, centralSize: number, centralOffset: number): Uint8Array {
    const end = new DataView(new ArrayBuffer(END_RECORD_SIZE));
    end.setUint32(0, SIGNATURE_END, true);
    end.setUint16(8, count, true);
    end.setUint16(10, count, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, centralOffset, true);
    return new Uint8Array(end.buffer);
}

async function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
    const input = new Blob([bytes as BlobPart]);
    const stream = input.stream().pipeThrough(new CompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
        let value = index;
        for (let bit = 0; bit < 8; bit += 1) {
            // Reflected CRC-32/ISO-HDLC polynomial 0xEDB88320, as zip/gzip require.
            if ((value & 1) === 1) value = 0xedb88320 ^ (value >>> 1);
            else value >>>= 1;
        }
        table[index] = value >>> 0;
    }
    return table;
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        const index = (crc ^ byte) & 0xff;
        crc = (CRC_TABLE[index] ?? 0) ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function encode(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function concat(parts: ReadonlyArray<Uint8Array>): Uint8Array {
    let total = 0;
    for (const part of parts) total += part.length;
    const out = new Uint8Array(total);
    let at = 0;
    for (const part of parts) {
        out.set(part, at);
        at += part.length;
    }
    return out;
}
