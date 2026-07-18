import type { Equal } from "./assert.js";
import type { ByName } from "./lex.js";

/** The value a table holds for `Key` once re-keyed by name (`ByName`), or `never` when the key is absent. */
export type Lookup<Key extends string, Table> = Key extends keyof ByName<Table> ? ByName<Table>[Key] : never;

/** The type common to every row of a tuple at a field -- the intersection of each `Row[Field]`. */
export type IntersectField<Rows extends ReadonlyArray<object>, Field extends PropertyKey> =
    Rows extends readonly [infer Head extends Record<Field, unknown>, ...infer Rest extends ReadonlyArray<object>]
        ? Rest extends readonly [] ? Head[Field] : Head[Field] & IntersectField<Rest, Field>
        : never;

/** Whether every row of a tuple holds the identical type at a field; `Equal` is transitive across adjacent pairs. */
export type FieldsAgree<Rows extends ReadonlyArray<object>, Field extends PropertyKey> =
    Rows extends readonly [infer A extends Record<Field, unknown>, infer B extends Record<Field, unknown>, ...infer Rest extends ReadonlyArray<object>]
        ? Equal<A[Field], B[Field]> extends true ? FieldsAgree<readonly [B, ...Rest], Field> : false
        : true;
