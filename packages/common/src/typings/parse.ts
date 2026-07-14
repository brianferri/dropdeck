/** A parse failure carrying a human-readable diagnostic, distinct from a node so `FirstMatch` can flow it through. */
export type ParseError<Message extends string = string> = { parseError: Message };

/**
 * A parsed node paired with the input still to consume -- the parse-phase counterpart of tokenize-phase `Step`.
 * A domain that needs its node/rest bounded re-aliases this with constrained parameters (the bounds then flow to
 * `infer` sites), so the `{ node, rest }` shape lives here once while each grammar keeps its own constraints.
 */
export type Parsed<Node, Rest> = { node: Node, rest: Rest };

/** A token stream with a read position; the runtime parsers walk it by advancing `index`. */
export type Cursor<T> = { tokens: ReadonlyArray<T>, index: number };

/** A positioned token span: its kind and the half-open [`start`, `end`) source offsets it covers. */
export type Token<Kind> = { readonly kind: Kind, readonly start: number, readonly end: number };
