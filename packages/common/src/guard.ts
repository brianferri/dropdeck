// A predicate narrowing an arbitrary string to the keys of `table`, backed by a `Set` for membership.
export function keyGuard<T extends object>(table: T): (key: string) => key is keyof T & string {
    const keys = new Set<string>(Object.keys(table));
    return (key): key is keyof T & string => keys.has(key);
}

// A predicate narrowing an arbitrary string to one of `values` -- typically the members of a string enum.
export function memberGuard<T extends string>(values: Iterable<T>): (value: string) => value is T {
    const set = new Set<string>(values);
    return (value): value is T => set.has(value);
}
