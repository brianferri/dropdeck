import type { CssNodeKind, CssValueKind } from "../Specification.js";
import type { SelectorKind, Combinator } from "../Selector.js";
import type { CssTokenKind } from "../Tokenizer.js";

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

export type SimpleSelector<Kind extends SelectorKind = SelectorKind, Name extends string = string> = {
    readonly kind: Kind,
    readonly name: Name
};

// The first step carries a sentinel `Descendant` combinator, not a real one.
export type SelectorStep<C extends Combinator = Combinator, Compound extends ReadonlyArray<SimpleSelector> = ReadonlyArray<SimpleSelector>> = {
    readonly combinator: C,
    readonly compound: Compound
};

export type ComplexSelector = ReadonlyArray<SelectorStep>;

export type CssToken = {
    readonly kind: CssTokenKind,
    readonly text: string
};

export type CodepointRange = readonly [number, number];

// A `transform` value is nothing more than the function component-values of a generic CSS value (see ../Value), so
// transform is a view over the spec. Resolving the list to a numeric matrix is ../Matrix.
export type TransformList = ReadonlyArray<FunctionValue>;

// A 2D affine matrix -- the six numbers of CSS `matrix()`, the canonical form every 2D transform composes to.
// A point (x, y) maps to (a*x + c*y + e, b*x + d*y + f).
export type Matrix = readonly [number, number, number, number, number, number];

// What a target with no shear (a slide shape: position, size, one rotation) needs from an arbitrary matrix.
export type Decomposed = {
    translateXPx: number,
    translateYPx: number,
    rotateDeg: number,
    scaleX: number,
    scaleY: number,
    skewXDeg: number
};
