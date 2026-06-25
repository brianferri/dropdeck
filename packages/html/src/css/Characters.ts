export function isWhitespace(character: string): boolean {
    return character === " " || character === "\t" || character === "\n" || character === "\r" || character === "\f";
}

export function isDigit(character: string): boolean {
    return character >= "0" && character <= "9";
}

export function isHexDigit(character: string): boolean {
    if (isDigit(character)) return true;
    const lower = character.toLowerCase();
    return lower >= "a" && lower <= "f";
}

function isLetter(character: string): boolean {
    const lower = character.toLowerCase();
    return lower >= "a" && lower <= "z";
}

// Hyphen starts `--custom`/`-webkit-`, and CSS treats non-ASCII bytes as name code points.
export function isIdentStart(character: string): boolean {
    if (character === "") return false;
    if (isLetter(character)) return true;
    if (character === "_" || character === "-") return true;
    return character.charCodeAt(0) > 127;
}

export function isNameChar(character: string): boolean {
    if (character === "") return false;
    if (isIdentStart(character)) return true;
    return isDigit(character);
}
