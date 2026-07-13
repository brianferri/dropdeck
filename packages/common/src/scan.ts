// Plain character predicates rather than regexes, so a scanner never backtracks across a character.

export function isDigit(character: string): boolean {
    return character >= "0" && character <= "9";
}

export function isAsciiLetter(character: string): boolean {
    if (character >= "a" && character <= "z") return true;
    return character >= "A" && character <= "Z";
}

export function isWhitespace(character: string): boolean {
    return character === " " || character === "\n" || character === "\t" || character === "\r";
}

// Reads a run of digits with an optional fractional part, returning its value and the index past it.
export function readNumber(source: string, start: number): { value: number, next: number } {
    let index = start;
    while (index < source.length && isDigit(source[index])) index += 1;
    if (source[index] === "." && index + 1 < source.length && isDigit(source[index + 1])) {
        index += 1;
        while (index < source.length && isDigit(source[index])) index += 1;
    }
    return { value: Number(source.slice(start, index)), next: index };
}
