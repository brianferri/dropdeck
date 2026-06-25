// A typed membership guard: narrows a dynamic key to one of `container`'s own keys, so a subsequent lookup
// needs no cast and an absent key falls through. Reusable wherever a `string` indexes a fixed-shape object.
export function has<T extends object>(key: PropertyKey, container: T): key is keyof T {
    return key in container;
}
