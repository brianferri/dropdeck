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

export enum CssValueKind {
    Keyword = "keyword",
    Number = "number",
    Dimension = "dimension",
    Percentage = "percentage",
    Str = "string",
    Hash = "hash",
    Delimiter = "delimiter",
    Separator = "separator",
    Function = "function",
    Block = "block"
}

export type Keyword<Name extends string = string> = { readonly kind: CssValueKind.Keyword, readonly name: Name };
export type NumberValue<Text extends string = string> = { readonly kind: CssValueKind.Number, readonly text: Text };
export type Dimension<Value extends string = string, Unit extends string = string> = { readonly kind: CssValueKind.Dimension, readonly value: Value, readonly unit: Unit };
export type Percentage<Value extends string = string> = { readonly kind: CssValueKind.Percentage, readonly value: Value };
export type StringValue<Text extends string = string> = { readonly kind: CssValueKind.Str, readonly text: Text };
export type Hash<Text extends string = string> = { readonly kind: CssValueKind.Hash, readonly text: Text };
export type Delimiter<Char extends string = string> = { readonly kind: CssValueKind.Delimiter, readonly char: Char };
export type Separator<Char extends "," | " " = "," | " "> = { readonly kind: CssValueKind.Separator, readonly char: Char };

export type FunctionValue<Name extends string = string, Value extends ComponentValues = ComponentValues> = {
    readonly kind: CssValueKind.Function,
    readonly name: Name,
    readonly value: Value
};

export type Block<Open extends "(" | "[" | "{" = "(" | "[" | "{", Value extends ComponentValues = ComponentValues> = {
    readonly kind: CssValueKind.Block,
    readonly open: Open,
    readonly value: Value
};

export type ComponentValue =
    | Keyword
    | NumberValue
    | Dimension
    | Percentage
    | StringValue
    | Hash
    | Delimiter
    | Separator
    | FunctionValue
    | Block;

export type ComponentValues = ReadonlyArray<ComponentValue>;
