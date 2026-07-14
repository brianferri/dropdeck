// Plain predicates rather than a regex so the scanner cannot backtrack across a character.
import { isAsciiLetter, isDigit, isWhitespace } from "@dropdeck/common";

export { isWhitespace };

export function isTagNameChar(character: string): boolean {
    return isAsciiLetter(character) || isDigit(character) || character === "-" || character === ":";
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
