export function has<T extends object>(key: PropertyKey, container: T): key is keyof T {
    return key in container;
}

export function keysOf<T extends object>(container: T): Array<keyof T> {
    return Object.keys(container) as Array<keyof T>;
}
