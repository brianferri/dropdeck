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
export type MathMLAttr = { [K in MathMLAttrName]: readonly [K, NonNullable<MathMLAttrTable[K]>] }[MathMLAttrName];
export type MathMLAttrs = ReadonlyArray<MathMLAttr>;
