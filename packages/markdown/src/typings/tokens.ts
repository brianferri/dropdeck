import type { Token as SpanToken } from "@dropdeck/common";
import type { TokenKind } from "../Tokenizer.js";

export type Token = SpanToken<TokenKind>;
