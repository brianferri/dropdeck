import type { TokenKind } from "../Tokenizer.js";
import type { AttrList } from "./nodes.js";

export type Token =
    | { kind: TokenKind.StartTag, name: string, attrs: AttrList, selfClosing: boolean }
    | { kind: TokenKind.EndTag, name: string }
    | { kind: TokenKind.Text, value: string }
    | { kind: TokenKind.Comment }
    | { kind: TokenKind.Eof };
