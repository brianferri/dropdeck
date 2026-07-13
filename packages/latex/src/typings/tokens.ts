import type { PayloadKind, PunctKind } from "../Tokenizer.js";

export type TokenKind = PayloadKind | PunctKind;

export type Token =
    | { kind: PayloadKind.Number, value: number }
    | { kind: PayloadKind.Letter, name: string }
    | { kind: PayloadKind.Command, name: string }
    | { kind: PayloadKind.Operator, symbol: string }
    | { kind: PunctKind };
