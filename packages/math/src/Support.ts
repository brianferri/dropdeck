export class MathError extends Error {
    public readonly offset: number;

    public constructor(message: string, offset: number) {
        super(message);
        this.name = "MathError";
        this.offset = offset;
    }
}
