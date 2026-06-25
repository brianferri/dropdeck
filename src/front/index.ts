export { compile, DiagnosticSeverity } from "#/front/pipeline";
export { slideStarts } from "#/front/parser";
export type { Diagnostic, CompileResult } from "#/front/pipeline";

export const COMPONENT_FENCES = new Set(["metrics", "bars"]);
