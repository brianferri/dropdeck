import type { BinaryOperator, OPERATOR_PRECEDENCE } from "../Specification.js";

export type Precedence = (typeof OPERATOR_PRECEDENCE)[BinaryOperator];
