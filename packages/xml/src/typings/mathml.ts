import type { AttrOf } from "@dropdeck/common";

type MathMLAttrTable = {
    readonly id?: string,
    readonly class?: string,
    readonly xmlns?: string,
    readonly mathvariant?: string,
    readonly displaystyle?: boolean,
    readonly scriptlevel?: number | string,
    readonly stretchy?: boolean,
    readonly fence?: boolean,
    readonly separator?: boolean,
    readonly accent?: boolean
};

export type MathMLAttrName = keyof MathMLAttrTable;
export type MathMLAttr = AttrOf<MathMLAttrTable>;
export type MathMLAttrs = ReadonlyArray<MathMLAttr>;
