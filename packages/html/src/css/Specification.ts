export enum CssNodeKind {
    Declaration = "declaration",
    Rule = "rule",
    AtRule = "atRule"
}

// Property names stay `string` rather than a const-object union because CSS has hundreds, unlike the finite set
// of HTML tags.
export type Declaration<Property extends string = string, Value extends string = string> = {
    readonly kind: CssNodeKind.Declaration,
    readonly property: Property,
    readonly value: Value,
    readonly important: boolean
};

export type Rule<
    Selectors extends ReadonlyArray<string> = ReadonlyArray<string>,
    Body extends ReadonlyArray<Declaration> = ReadonlyArray<Declaration>
> = {
    readonly kind: CssNodeKind.Rule,
    readonly selectors: Selectors,
    readonly declarations: Body
};

export type AtRule<
    Name extends string = string,
    Prelude extends string = string,
    Body extends Stylesheet | null = Stylesheet | null
> = {
    readonly kind: CssNodeKind.AtRule,
    readonly name: Name,
    readonly prelude: Prelude,
    readonly body: Body
};

export type StyleNode = Rule | AtRule | Declaration;

export type Stylesheet = ReadonlyArray<StyleNode>;
