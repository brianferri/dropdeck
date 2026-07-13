import { AccentKind } from "#/formula/nodes";

type AccentByValue = { [Kind in AccentKind as `${Kind}`]: Kind };
export type AccentKindOf<Value extends string> = Value extends keyof AccentByValue ? AccentByValue[Value] : never;

const ACCENT_KINDS = new Set<string>(Object.values(AccentKind));

export function isAccentKind(value: string): value is AccentKind {
    return ACCENT_KINDS.has(value);
}
