import type { TokenKind } from "../Tokenizer.js";

export type Token = {
    readonly kind: TokenKind,
    readonly start: number,
    readonly end: number
};
