export type Cursor = {
    readonly source: string,
    offset: number
};

export function cursor(source: string): Cursor {
    return { source, offset: 0 };
}

export function eof(c: Cursor): boolean {
    return c.offset >= c.source.length;
}

export function peek(c: Cursor, ahead: number): string {
    return c.source.charAt(c.offset + ahead);
}

export function advance(c: Cursor): string {
    const character = c.source.charAt(c.offset);
    c.offset += 1;
    return character;
}

export function startsWith(c: Cursor, literal: string): boolean {
    return c.source.startsWith(literal, c.offset);
}

export function startsWithInsensitive(c: Cursor, literal: string): boolean {
    return c.source.slice(c.offset, c.offset + literal.length).toLowerCase() === literal;
}

export function consume(c: Cursor, literal: string): boolean {
    if (!startsWith(c, literal)) return false;
    c.offset += literal.length;
    return true;
}

export function readUntil(c: Cursor, literal: string): string {
    const found = c.source.indexOf(literal, c.offset);
    const end = found === -1 ? c.source.length : found;
    const out = c.source.slice(c.offset, end);
    c.offset = end;
    return out;
}

export function readWhile(c: Cursor, predicate: (character: string) => boolean): string {
    const start = c.offset;
    while (c.offset < c.source.length && predicate(c.source.charAt(c.offset))) c.offset += 1;
    return c.source.slice(start, c.offset);
}

export function skipWhile(c: Cursor, predicate: (character: string) => boolean): void {
    while (c.offset < c.source.length && predicate(c.source.charAt(c.offset))) c.offset += 1;
}
