import type { LatexStructuralCommand } from "../Specification.js";
import type { Notation, One, Pair } from "./nodes.js";

// The operands each structural command wraps, so the parser and serializer share one arity source (mirrors the
// math package's `MathArguments`). `\sqrt` optionally takes an index, so it accepts one operand or a pair.
export type LatexStructuralArguments = {
    [LatexStructuralCommand.Frac]: Pair<Notation, Notation>,
    [LatexStructuralCommand.Sqrt]: One<Notation> | Pair<Notation, Notation>
};
