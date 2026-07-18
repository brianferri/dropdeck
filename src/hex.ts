import { isHexDigit } from "@dropdeck/common";

// Strips an optional leading `#`, expands a 3-digit shorthand to six, and rejects anything that is not six hex
// digits -- the shared front of every color path (theme vars, pptx fills, the editor swatch, the morph tween).
// Returns the bare `rrggbb` with no `#`, or null when the value is not a hex color.
export function expandHex(value: string): string | null {
    const raw = value.startsWith("#") ? value.slice(1) : value;
    const body = raw.length === 3 ? raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2] : raw;
    if (body.length !== 6) return null;
    for (const ch of body) if (!isHexDigit(ch)) return null;
    return body;
}

/** The three 0-255 channels of a hex color (`#rgb` or `#rrggbb`), or null when the value is not a hex color. */
export function parseHex(value: string): [number, number, number] | null {
    const body = expandHex(value);
    if (body === null) return null;
    const packed = parseInt(body, 16);
    return [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255];
}
