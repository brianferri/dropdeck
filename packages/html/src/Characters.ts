// Plain predicates rather than a regex so the scanner cannot backtrack across a character.

export function isWhitespace(character: string): boolean {
    return character === " " || character === "\t" || character === "\n" || character === "\r" || character === "\f";
}

export function isAsciiLetter(character: string): boolean {
    return (character >= "a" && character <= "z") || (character >= "A" && character <= "Z");
}

export function isAsciiDigit(character: string): boolean {
    return character >= "0" && character <= "9";
}

export function isTagNameChar(character: string): boolean {
    return isAsciiLetter(character) || isAsciiDigit(character) || character === "-" || character === ":";
}

export function isAttributeNameChar(character: string): boolean {
    if (isWhitespace(character)) return false;
    if (character === "=" || character === ">" || character === "/" || character === "<") return false;
    return character !== "\"" && character !== "'";
}

export function isUnquotedValueChar(character: string): boolean {
    if (isWhitespace(character)) return false;
    if (character === ">" || character === "<" || character === "=" || character === "`") return false;
    return character !== "\"" && character !== "'";
}
