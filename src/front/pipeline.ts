import { parse } from "#/front/parser";
import type { ParseDeck } from "#/front/Parse";
import type { Deck } from "#/ir";

export enum DiagnosticSeverity {
    Error = "error",
    Warning = "warning"
}

export type Diagnostic = {
    severity: DiagnosticSeverity,
    message: string
};

export type CompileResult<D extends Deck = Deck> = {
    deck: D,
    diagnostics: Array<Diagnostic>
};

export function compile<const S extends string>(source: S): CompileResult<ParseDeck<S>> {
    const deck = parse(source);
    const diagnostics: Array<Diagnostic> = [];
    if (deck.slides.length === 0)
        diagnostics.push({ severity: DiagnosticSeverity.Error, message: "No slides found in that file." });

    return { deck, diagnostics };
}
