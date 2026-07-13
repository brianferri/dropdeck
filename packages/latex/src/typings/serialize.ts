import type { LatexStructuralCommand } from "../Specification.js";
import type { FirstMatch } from "@dropdeck/common";
import type {
    AccentNode, Content, FencedNode, FractionNode, IdentifierNode, Notation, NumberNode,
    OperatorNode, RadicalNode, RowNode, SubscriptNode, SuperscriptNode
} from "./nodes.js";
import type { LatexStructuralArguments } from "./functions.js";

type SerializeRow<Children extends Content> =
    Children extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? Rest extends readonly [] ? Serialize<Head> : `${Serialize<Head>} ${SerializeRow<Rest>}`
        : "";

type ScriptBase<Base extends Notation> = Base extends RowNode ? `{${Serialize<Base>}}` : Serialize<Base>;

type NumberText<E extends Notation> = E extends NumberNode<infer Value> ? `${Value}` : false;
type IdentifierText<E extends Notation> = E extends IdentifierNode<infer Symbol> ? Symbol : false;
type OperatorText<E extends Notation> = E extends OperatorNode<infer Symbol> ? Symbol : false;
type RowText<E extends Notation> = E extends RowNode<infer Children extends Content> ? SerializeRow<Children> : false;
type FencedText<E extends Notation> =
    E extends FencedNode<infer Open extends string, infer Close extends string, readonly [infer Inner extends Notation]>
        ? `${Open}${Serialize<Inner>}${Close}` : false;

// A layout command whose children each serialise inside their own braces (`\frac{a}{b}`), matched off its node --
// the type mirror of the runtime `structural`. A new such command is one rule: `StructuralText<E, Node, Command>`.
type BracedArgs<Args extends Content> =
    Args extends readonly [infer Head extends Notation, ...infer Rest extends Content]
        ? `{${Serialize<Head>}}${BracedArgs<Rest>}` : "";
type StructuralText<E extends Notation, Node, Command extends LatexStructuralCommand> =
    E extends Node & { children: infer Args extends LatexStructuralArguments[Command] } ? `\\${Command}${BracedArgs<Args>}` : false;

type FractionText<E extends Notation> = StructuralText<E, FractionNode, LatexStructuralCommand.Frac>;

// Superscript and subscript share a shape; `Script` carries the delimiter (`^` or `_`).
type ScriptText<E extends Notation, Node, Script extends string> =
    E extends Node & { children: readonly [infer Base extends Notation, infer Argument extends Notation] }
        ? `${ScriptBase<Base>}${Script}{${Serialize<Argument>}}` : false;
type SuperscriptText<E extends Notation> = ScriptText<E, SuperscriptNode, "^">;
type SubscriptText<E extends Notation> = ScriptText<E, SubscriptNode, "_">;

// A command with an optional bracketed index before its braced operand (`\sqrt[n]{x}`); the mirror of `indexed`.
type IndexedText<E extends Notation, Node, Command extends LatexStructuralCommand> =
    E extends Node & { children: readonly [infer Main extends Notation, infer Index extends Notation] }
        ? `\\${Command}[${Serialize<Index>}]{${Serialize<Main>}}`
        : StructuralText<E, Node, Command>;
type RadicalText<E extends Notation> = IndexedText<E, RadicalNode, LatexStructuralCommand.Sqrt>;

type AccentText<E extends Notation> =
    E extends AccentNode<infer Command extends string, readonly [infer Base extends Notation]>
        ? `\\${Command}{${Serialize<Base>}}` : false;

export type Serialize<E extends Notation> = FirstMatch<[
    NumberText<E>,
    IdentifierText<E>,
    OperatorText<E>,
    RowText<E>,
    FencedText<E>,
    FractionText<E>,
    SuperscriptText<E>,
    SubscriptText<E>,
    RadicalText<E>,
    AccentText<E>
]>;
