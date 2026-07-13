import type { BinaryOperator, UnaryOperator } from "../Specification.js";
import type { PayloadKind, PunctKind } from "../Tokenizer.js";

export type TokenKind = PayloadKind | PunctKind;

export type Operator = BinaryOperator | UnaryOperator;

export type Token =
    | { kind: PayloadKind.Number, value: number }
    | { kind: PayloadKind.Name, name: string }
    | { kind: PayloadKind.Operator, operator: Operator }
    | { kind: PunctKind };
