import { isAsciiLetter, isDigit, isHexDigit, isWhitespace } from "@dropdeck/common";

export { isDigit, isHexDigit, isWhitespace };

// Hyphen starts `--custom`/`-webkit-`, and CSS treats non-ASCII bytes as name code points.
export function isIdentStart(character: string): boolean {
    if (character === "") return false;
    if (isAsciiLetter(character)) return true;
    if (character === "_" || character === "-") return true;
    return character.charCodeAt(0) > 127;
}

export function isNameChar(character: string): boolean {
    if (character === "") return false;
    if (isIdentStart(character)) return true;
    return isDigit(character);
}
