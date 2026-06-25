export type CodepointRange = readonly [number, number];

export function parseUnicodeRange(value: string): Array<CodepointRange> {
    const ranges: Array<CodepointRange> = [];
    for (const entry of value.split(",")) {
        const token = entry.trim();
        if (!token.toLowerCase().startsWith("u+")) continue;
        const body = token.slice(2);
        const dash = body.indexOf("-");
        if (dash >= 0)
            ranges.push([parseInt(body.slice(0, dash), 16), parseInt(body.slice(dash + 1), 16)]);
        else if (body.includes("?"))
            ranges.push([parseInt(body.replaceAll("?", "0"), 16), parseInt(body.replaceAll("?", "f"), 16)]);
        else {
            const code = parseInt(body, 16);
            ranges.push([code, code]);
        }
    }
    return ranges;
}

export function unicodeRangeCovers(ranges: ReadonlyArray<CodepointRange>, code: number): boolean {
    for (const [start, end] of ranges) if (code >= start && code <= end) return true;
    return false;
}
