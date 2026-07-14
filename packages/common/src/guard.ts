export function keyGuard<T extends object>(table: T): (key: string) => key is keyof T & string {
    const keys = new Set<string>(Object.keys(table));
    return (key): key is keyof T & string => keys.has(key);
}

export function memberGuard<T extends string>(values: Iterable<T>): (value: string) => value is T {
    const set = new Set<string>(values);
    return (value): value is T => set.has(value);
}

/** Runtime mirror of the type-level `BySpelling`: folds each member onto itself so a scanned run indexes to it. */
export function bySpelling<T extends string>(members: Iterable<T>): Record<string, T | undefined> {
    const table: Record<string, T | undefined> = {};
    for (const member of members) table[member] = member;
    return table;
}
