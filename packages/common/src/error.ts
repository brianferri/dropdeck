export class SourceError extends Error {
    public readonly offset: number;

    public constructor(message: string, offset: number) {
        super(message);
        this.offset = offset;
    }
}
