export function isDigit(character: string): boolean {
    return character >= "0" && character <= "9";
}

export function isHexDigit(character: string): boolean {
    if (isDigit(character)) return true;
    const lower = character.toLowerCase();
    return lower >= "a" && lower <= "f";
}

export function isAsciiLetter(character: string): boolean {
    if (character >= "a" && character <= "z") return true;
    return character >= "A" && character <= "Z";
}

/** A single character is whitespace when it trims away; the finite `Whitespace` type is the type-level counterpart. */
export function isWhitespace(character: string): boolean {
    return character.trim() === "";
}

export function readNumber(source: string, start: number): { value: number, next: number } {
    let index = start;
    while (index < source.length && isDigit(source[index])) index += 1;
    if (source[index] === "." && index + 1 < source.length && isDigit(source[index + 1])) {
        index += 1;
        while (index < source.length && isDigit(source[index])) index += 1;
    }
    return { value: Number(source.slice(start, index)), next: index };
}
