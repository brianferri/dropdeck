// A parse/tokenize failure carrying the source offset where it occurred; frontends subclass it for their name.
export class SourceError extends Error {
    public readonly offset: number;

    public constructor(message: string, offset: number) {
        super(message);
        this.offset = offset;
    }
}
