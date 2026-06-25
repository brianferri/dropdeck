// `Partial` types a miss as `undefined` so an unrecognised entity is left verbatim rather than dropped.
const NAMED_ENTITIES: Partial<Record<string, string>> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
    copy: "\u00a9",
    reg: "\u00ae",
    trade: "\u2122",
    hellip: "\u2026",
    mdash: "\u2014",
    ndash: "\u2013",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201c",
    rdquo: "\u201d",
    laquo: "\u00ab",
    raquo: "\u00bb",
    deg: "\u00b0",
    plusmn: "\u00b1",
    times: "\u00d7",
    divide: "\u00f7",
    micro: "\u00b5",
    middot: "\u00b7",
    bull: "\u2022",
    dagger: "\u2020",
    prime: "\u2032",
    ge: "\u2265",
    le: "\u2264",
    ne: "\u2260",
    equiv: "\u2261",
    asymp: "\u2248",
    infin: "\u221e",
    sum: "\u2211",
    prod: "\u220f",
    radic: "\u221a",
    part: "\u2202",
    int: "\u222b",
    rarr: "\u2192",
    larr: "\u2190",
    uarr: "\u2191",
    darr: "\u2193",
    harr: "\u2194",
    rArr: "\u21d2",
    alpha: "\u03b1",
    beta: "\u03b2",
    gamma: "\u03b3",
    delta: "\u03b4",
    pi: "\u03c0",
    sigma: "\u03c3",
    mu: "\u03bc",
    lambda: "\u03bb",
    theta: "\u03b8",
    omega: "\u03c9",
    euro: "\u20ac",
    pound: "\u00a3",
    cent: "\u00a2",
    sect: "\u00a7",
    para: "\u00b6",
    eacute: "\u00e9",
    egrave: "\u00e8",
    agrave: "\u00e0",
    ccedil: "\u00e7",
    uuml: "\u00fc",
    ouml: "\u00f6",
    auml: "\u00e4",
    szlig: "\u00df",
    ntilde: "\u00f1",
    frac12: "\u00bd",
    frac14: "\u00bc",
    frac34: "\u00be"
};

// Bounds the scan after a stray `&` so an ampersand in prose cannot match a `;` far across the document.
const REFERENCE_BODY_LENGTH_MAX = 32;

function decodeNumeric(body: string): string | null {
    const hex = body.charAt(1) === "x" || body.charAt(1) === "X";
    const code = hex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    if (Number.isNaN(code)) return null;
    if (code <= 0) return null;
    return String.fromCodePoint(code);
}

function decodeOne(body: string): string | null {
    if (body.startsWith("#")) return decodeNumeric(body);
    return NAMED_ENTITIES[body] ?? null;
}

export function decodeEntities(text: string): string {
    let cursor = text.indexOf("&");
    if (cursor === -1) return text;
    let out = "";
    let copied = 0;
    while (cursor !== -1) {
        const semicolon = text.indexOf(";", cursor + 1);
        const decoded = semicolon === -1 || semicolon - cursor > REFERENCE_BODY_LENGTH_MAX
            ? null
            : decodeOne(text.slice(cursor + 1, semicolon));
        if (decoded !== null) {
            out += text.slice(copied, cursor) + decoded;
            copied = semicolon + 1;
            cursor = text.indexOf("&", copied);
        } else
            cursor = text.indexOf("&", cursor + 1);
    }
    return out + text.slice(copied);
}

function escape(value: string, quotes: boolean): string {
    let out = "";
    let copied = 0;
    for (let index = 0; index < value.length; index += 1) {
        const character = value.charAt(index);
        const replacement = escapeOne(character, quotes);
        if (replacement === null) continue;
        out += value.slice(copied, index) + replacement;
        copied = index + 1;
    }
    return copied === 0 ? value : out + value.slice(copied);
}

function escapeOne(character: string, quotes: boolean): string | null {
    if (character === "&") return "&amp;";
    if (character === "<") return "&lt;";
    if (character === ">") return "&gt;";
    if (quotes && character === "\"") return "&quot;";
    return null;
}

export function escapeText(value: string): string {
    return escape(value, false);
}

export function escapeAttribute(value: string): string {
    return escape(value, true);
}
