// A parse failure carrying a human-readable diagnostic, distinct from a node so `FirstMatch` can flow it through.
export type ParseError<Message extends string = string> = { parseError: Message };
