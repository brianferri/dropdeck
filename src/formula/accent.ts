import { AccentKind } from "#/formula/nodes";
import { memberGuard } from "@dropdeck/common";
import type { BySpelling } from "@dropdeck/common";

type AccentByValue = BySpelling<AccentKind>;
export type AccentKindOf<Value extends string> = Value extends keyof AccentByValue ? AccentByValue[Value] : never;

export const isAccentKind = memberGuard<AccentKind>(Object.values(AccentKind));
